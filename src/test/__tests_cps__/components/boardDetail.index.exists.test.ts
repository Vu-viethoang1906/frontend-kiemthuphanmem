import '@testing-library/jest-dom';

test('BoardDetail barrel exports are defined', async () => {
  const mod = await import('../../../components/BoardDetail');
  expect(mod.TaskCard).toBeTruthy();
  expect(mod.CreateTaskModal).toBeTruthy();
  expect(mod.EditTaskModal).toBeTruthy();
  expect(mod.TagManagerModal).toBeTruthy();
  expect(mod.FilterDropdown).toBeTruthy();
});
