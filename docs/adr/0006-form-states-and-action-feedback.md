# ADR 0006: Form states and action feedback

- Status: Accepted

## Context

Forms accumulate noise: an error sentence repeating what the label already says, a "Saving…" paragraph beside the fields while the button already shows progress, a failed-save message inside the form that looks like a field error. A failed save is the outcome of an action, not a property of a field.

## Decision

**Fields.** `formControl()` stacks a label, the control, an optional validation message and an optional caption, in Primer's order with 4 px between them. The label is always visible; a required field adds an asterisk to it. The control records its label, its description, and whether it is required or invalid.

**Validation.** A genuinely invalid value gets a validation message: a 12 px icon and a semibold sentence in `fgColor/danger` that names the problem and the fix, and the field's edge turns `control/borderColor/danger`. Colour is never the only signal. An empty required field before submission is not an error: the label already states the requirement. A caption is optional and must add something, such as a format or a consequence.

**Disabled.** A disabled field, its label and its caption use `control/fgColor/disabled`, and the group is marked disabled. The audit reports that text but exempts it from WCAG 1.4.3.

**Saving.** Save stays disabled while the form has nothing to save, without an explanation. Once something changes, Save becomes available and an invisible Discard button appears. During a save, the button's loading state is the only progress signal: a spinner takes the label's place, so the button keeps its size, and the button is marked busy.

**A failed save.** A critical Banner appears at the top of the content, above the form: the danger tint and border, a `stop` icon, a title, a sentence saying the change is still there, and a Dismiss button. It is announced as an alert and never times out. Dismissing it keeps the draft, and retrying uses the existing Save button. A field that is genuinely invalid keeps its own message; the banner never replaces it.

Advance only after a confirmed success. A confirmed failure keeps the whole draft.

## Ownership

`kit/components/form-control.ts` owns the field anatomy and its accessibility metadata. `kit/components/feedback.ts` owns Banner, InlineMessage, Blankslate and skeletons, and `button()` owns the loading state. Pages own the outcome. Sheet C3 shows the field states and C5 the feedback components. Screens `05` to `07` show the Settings form at rest, with an unsaved change, and after a failed save, and the prototype links them.

The plugin produces static states and metadata. It does not implement events, live regions or persistence.

## Rejected alternatives

- A toast for a failed save: Primer React has no toast, and a message that leaves on a timer can be missed.
- A save error inside the form, where it reads as a field error.
- A second Retry button beside Save.
- A repeated "This field is required" under a label that already says so.

The [W3C error-identification guidance](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) requires the error to be identified in text, and its [form notifications tutorial](https://www.w3.org/WAI/tutorials/forms/notifications/) supports clear, associated corrections.
