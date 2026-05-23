## Quick fix: replace placeholder gigs on landing page

Swap the three hardcoded sample cards in `src/routes/index.tsx` (PreviewCard with "10th Grade Physics Tuition", "Social Media Poster Design", "Excel Inventory Cleanup") with clearly-fake labels so visitors don't mistake them for real listings:

- "Your gig appears here" — Local area · Pay shown here — Example
- "Another sample gig" — Remote or nearby · Example pay — Example
- "Real gigs from your town" — Posted by neighbours · Example pay — Example

No other changes in this step — the rest of the bigger plan (Gigs Hub rebrand, locality selector with GPS + nearby matching + Njeezhoor/Kaduthuruthy, gig delete, admin moderation, Twilio OTP) stays as previously approved and continues afterward.