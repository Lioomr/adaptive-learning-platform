# Simulated role permissions

The route sets the active simulated role. Only Student may call the assessment action; the action also requires its selected fictional student and enrolled course. Instructor and Advisor views read the same records and cannot submit through that action. The explicit Reset demo control is available in all views. Instructor assignment and advisor caseload restrictions, simulated approvals and nudges are later portal work.

These client-side checks prevent accidental UI misuse; anyone controlling a browser can alter state or select a role. They are not real authentication or security authorization. No private real records belong in the demo.
