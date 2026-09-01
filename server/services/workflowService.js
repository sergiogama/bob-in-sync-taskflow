const CONFIGURABLE_FIELDS = [
  'expected_behavior', 'steps_to_reproduce', 'environment',
  'business_rules', 'acceptance_criteria',
];

function forbidden(message) {
  throw Object.assign(new Error(message), { status: 403 });
}

export function createWorkflowService(ticketModel, commentModel, workflowModel, activityService) {
  return {
    getSettings() {
      return workflowModel.getSettings();
    },
    updateSettings(data, user, context) {
      const required = data.required_fields;
      if (!required || typeof required !== 'object') {
        throw Object.assign(new Error('Required fields configuration is required.'), { status: 400 });
      }
      for (const fields of Object.values(required)) {
        if (!Array.isArray(fields) || fields.some((field) => !CONFIGURABLE_FIELDS.includes(field))) {
          throw Object.assign(new Error('Required fields configuration contains an invalid field.'), { status: 400 });
        }
      }
      const titleMin = Number(data.title_min_length);
      const descriptionMin = Number(data.description_min_length);
      if (titleMin < 5 || titleMin > 160 || descriptionMin < 20 || descriptionMin > 2000) {
        throw Object.assign(new Error('Readiness minimum lengths are outside the supported range.'), { status: 400 });
      }
      if (!data.not_ready_comment_template?.trim()) {
        throw Object.assign(new Error('NOT READY comment guidance is required.'), { status: 400 });
      }
      return activityService.run(() => {
        const settings = workflowModel.updateSettings({
          required_fields: required,
          title_min_length: titleMin,
          description_min_length: descriptionMin,
          not_ready_comment_template: data.not_ready_comment_template.trim(),
          notifications_enabled: Boolean(data.notifications_enabled),
          notify_requester: Boolean(data.notify_requester),
          notify_assignee: Boolean(data.notify_assignee),
        }, user.id);
        activityService.recordSystem(user, context, 'WORKFLOW_SETTINGS_UPDATED', {
          criteria_version: settings.criteria_version,
        });
        return settings;
      });
    },
    review(ticketId, user, context) {
      if (!['Analyst', 'Manager'].includes(user.role) && user.email !== 'ibm.bob@taskflow.local') {
        forbidden('Only Analysts, Managers, and IBM Bob can review ticket readiness.');
      }
      const ticket = ticketModel.findById(ticketId);
      if (!ticket) throw Object.assign(new Error('Ticket not found.'), { status: 404 });
      const { settings, missing } = workflowModel.analyze(ticket);
      const result = missing.length ? 'NOT_READY' : 'READY';
      const summary = missing.length
        ? `The request needs ${missing.length} additional information item${missing.length === 1 ? '' : 's'} before work can begin.`
        : 'The request contains the information required to begin work.';
      const previous = workflowModel.listReviews(ticketId)[0];
      if (previous?.criteria_version === settings.criteria_version && previous.result === result &&
        JSON.stringify(previous.missing_information) === JSON.stringify(missing)) {
        return { ticket, review: previous, unchanged: true };
      }
      return activityService.run(() => {
        const review = workflowModel.createReview({
          ticketId, reviewerId: user.id, result, summary,
          missingInformation: missing, criteriaVersion: settings.criteria_version,
          source: context.source,
        });
        if (result === 'NOT_READY') {
          const bullets = missing.map((item) => `- ${item}`).join('\n');
          commentModel.create({
            ticketId, authorId: user.id,
            content: `NOT READY\n\n${settings.not_ready_comment_template}\n${bullets}`,
          });
        }
        const updated = ticketModel.findById(ticketId);
        activityService.record(updated, user, context, 'READINESS_REVIEWED', {
          result, summary, missing_information: missing,
          criteria_version: settings.criteria_version,
        });
        activityService.notify(updated, `READINESS_${result}`, user.id, summary);
        return { ticket: updated, review, unchanged: false };
      });
    },
  };
}
