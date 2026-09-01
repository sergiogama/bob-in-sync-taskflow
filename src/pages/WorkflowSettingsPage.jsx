import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/PageState.jsx';

const fields = [
  ['expected_behavior', 'Expected behavior'],
  ['steps_to_reproduce', 'Steps to reproduce'],
  ['environment', 'Environment'],
  ['business_rules', 'Business rules'],
  ['acceptance_criteria', 'Acceptance criteria'],
];
const groups = ['common', 'SOFTWARE', 'HARDWARE', 'ACCESS', 'OTHER'];

export default function WorkflowSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api('/workflow/settings').then(({ settings }) => setSettings(settings)).catch((e) => setError(e.message)); }, []);

  function set(name, value) { setSaved(false); setSettings({ ...settings, [name]: value }); }
  function toggle(group, field) {
    const current = settings.required_fields[group] || [];
    const next = current.includes(field) ? current.filter((item) => item !== field) : [...current, field];
    set('required_fields', { ...settings.required_fields, [group]: next });
  }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setSaved(false);
    try {
      const result = await api('/workflow/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setSettings(result.settings); setSaved(true);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  if (error && !settings) return <ErrorState message={error} />;
  if (!settings) return <LoadingState />;
  return <>
    <div className="page-header"><div><h1>Workflow settings</h1><p>Readiness criteria and ticket notification policy</p></div></div>
    <form className="panel settings-form" onSubmit={submit}>
      {error && <ErrorState message={error} />}{saved && <div className="alert success">Workflow settings saved. New reviews will use criteria version {settings.criteria_version}.</div>}
      <section><h2>Minimum request quality</h2><div className="form-grid"><label>Title minimum length<input type="number" min="5" max="160" value={settings.title_min_length} onChange={(e) => set('title_min_length', Number(e.target.value))} /></label><label>Description minimum length<input type="number" min="20" max="2000" value={settings.description_min_length} onChange={(e) => set('description_min_length', Number(e.target.value))} /></label></div></section>
      <section><h2>Required information</h2><p className="muted">Common fields apply to every category. Category fields are added to the common criteria.</p><div className="criteria-table">{groups.map((group) => <fieldset key={group}><legend>{group === 'common' ? 'All tickets' : group}</legend>{fields.map(([field, label]) => <label className="check-field" key={field}><input type="checkbox" checked={(settings.required_fields[group] || []).includes(field)} onChange={() => toggle(group, field)} />{label}</label>)}</fieldset>)}</div></section>
      <section><h2>NOT READY comment</h2><label>Guidance shown before missing items<textarea rows="3" value={settings.not_ready_comment_template} onChange={(e) => set('not_ready_comment_template', e.target.value)} required /></label></section>
      <section><h2>Notifications</h2><label className="check-field"><input type="checkbox" checked={settings.notifications_enabled} onChange={(e) => set('notifications_enabled', e.target.checked)} />Enable ticket notifications</label><label className="check-field"><input type="checkbox" checked={settings.notify_requester} onChange={(e) => set('notify_requester', e.target.checked)} />Notify requester</label><label className="check-field"><input type="checkbox" checked={settings.notify_assignee} onChange={(e) => set('notify_assignee', e.target.checked)} />Notify assigned user</label></section>
      <div className="form-actions"><button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button></div>
    </form>
  </>;
}
