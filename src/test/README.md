🧭 Goals of Our Testing Strategy

Test behavior, not implementation.

Prefer integration-style tests (component + children + providers + MSW).

Focus on user-visible outcomes, not internals.

Maximize coverage with minimal, stable, high-impact tests.

✅ What Tests SHOULD Include
1. User-Visible Behavior

Tests must verify what the user sees or interacts with, including:

Correct UI rendering

Button enable/disable logic

Input updates

Visible effects of props or state

Loading, success, and error states

2. User Interactions

Use React Testing Library to simulate real user actions:

Clicks

Typing

Keyboard navigation

Route changes (via useNavigate)

Use userEvent instead of low-level DOM events.

3. Component Logic (As Behavior)

Test outcomes, not internals:

Validation behavior

Conditional rendering

Component output when props change

State-driven UI changes

4. API Behavior (via MSW)

Test only the UI reaction, not the API itself:

Successful responses

Empty results

Errors

Loading states

MSW is required for mocking real-world network conditions.

5. Integration Scenarios

Integration-style tests provide the highest ROI:

Component + children

Component + router

Component + context/providers

Component + MSW-driven API calls

Avoid shallow or isolated tests unless absolutely necessary.

❌ What Tests SHOULD NOT Include
1. Implementation Details

Never test:

Internal state variables (useState)

Re-render counts

Private helper functions

Exact DOM structure

Class names (unless for accessibility)

Behavior is what matters.

2. Third-Party Library Behavior

Do not test:

React Router internals

Axios/fetch internals

UI libraries (Tailwind, MUI, Shadcn, AntD…)

Behavior of Testing Library itself

You only test your app logic.

3. Styling / CSS / Layout

Do NOT test:

Colors

Layout/spacing/position

Animations

Responsive breakpoints

Styling is not part of Jest’s responsibility.

4. Snapshot Tests

Snapshots are:

Brittle

Hard to maintain

Often meaningless

Avoid snapshot tests except for small static components.

5. Non-Semantic Queries

Avoid:

getByTestId (unless absolutely needed)

querySelector

Tests that depend on HTML structure

Prefer:

getByRole

getByText

getByLabelText

findBy* for async elements

6. Duplicated Business Logic

Tests must not replicate logic in the component:
✔ Assert the result,
✘ Not the internal step-by-step logic.

✔ Quick Pre-Commit Checklist

A test is good if:

 It tests a user-visible behavior

 It avoids implementation details

 It tests UI reaction, not API internals

 It avoids styling/third-party logic

 It uses semantic queries

 It’s simple, stable, readable

If all are yes → commit it.

🔥 High-ROI Testing Rules (Project Standard)

These rules provide the highest behavior coverage per line written.
Use them for all test decisions.

🎯 Focus First On (High-Impact Areas)
1. Permission Gates

Admin-only UI

Role-restricted pages

Center/Dashboard conditional visibility

These break often and are high business risk.

2. Primary Flows

Test the happy paths for:

Create

Edit

Delete

Submit

Assertions should verify:

Modals open

Buttons enable/disable correctly

Toasts show

Lists update

3. State Spectrum

For every data-driven page, test at least two of:

Loading → Loaded

Empty results

One error case

Focus on visible UI reactions.

4. Navigation

Verify route outcomes using minimal mocks:

useNavigate is called with the correct path

Critical redirects work

Role-based navigations work

5. Integration Seams

The most valuable tests combine:

Component + children

Providers (auth, router, theme, etc.)

MSW API mocking

Assert only what the user sees.

🚫 Avoid Low-Value Tests

Do NOT write tests for:

Implementation details

DOM structure

Third-party internals

Snapshot tests

Files under src/test/** (helpers/mocks)

These add maintenance cost with little coverage gain.

🧩 Semantic, Stable Queries

Use:

getByRole (preferred)

getByText

getByLabelText

findBy* for async

Use within() when multiple elements share labels.

Use findAllBy* or queryAllBy* when you expect duplicates.

Assertions should always match user-visible outcomes, not DOM structure.

🧪 Minimal Mocking Patterns
Router

Mock only the hooks you need:

useNavigate

useParams

useLocation

APIs

Use MSW or Jest mocks to simulate:

success

empty

error

Assert UI outcomes, not request bodies unless critical.

Toasts / Modals

Mock lightly:

react-hot-toast

Modal providers

Assert visible outcome or invocation.

✔ High-ROI Coverage Checklist

 Tests user-visible behavior

 Uses semantic queries

 Includes at least two UI states

 Covers a primary flow

 Avoids snapshots

 Avoids testing internals