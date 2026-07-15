import { getWorkflowExecutor, listWorkflowExecutors } from './executor-registry';

describe('executor-registry', () => {
  it('returns chat delegate executors for fetch_data', () => {
    const executor = getWorkflowExecutor('fetch_data', 'chat');
    expect(executor?.action).toBe('fetch_data');
  });

  it('returns page inline executors for fetch_data', () => {
    const chat = getWorkflowExecutor('fetch_data', 'chat');
    const page = getWorkflowExecutor('fetch_data', 'page');
    expect(page?.action).toBe('fetch_data');
    expect(page).not.toBe(chat);
  });

  it('returns page mutation executors for batch B actions', () => {
    expect(getWorkflowExecutor('compose_mutation', 'page')?.action).toBe(
      'compose_mutation',
    );
  });

  it('returns chat executors for batch B mutation actions', () => {
    expect(getWorkflowExecutor('compose_mutation', 'chat')?.action).toBe(
      'compose_mutation',
    );
    expect(getWorkflowExecutor('await_user_confirm', 'chat')?.action).toBe(
      'await_user_confirm',
    );
  });

  it('returns shared summarize_images executor for chat and page', () => {
    const chat = getWorkflowExecutor('summarize_images', 'chat');
    const page = getWorkflowExecutor('summarize_images', 'page');
    expect(chat?.action).toBe('summarize_images');
    expect(page?.action).toBe('summarize_images');
    expect(page).toBe(chat);
  });

  it('lists page executors including summarize_images', () => {
    expect(listWorkflowExecutors('page').map((row) => row.action)).toEqual([
      'load_page_context',
      'detect_clues',
      'fetch_data',
      'summarize_images',
      'generate_and_push',
      'summarize',
      'present_mutation',
      'compose_mutation',
      'write_data',
      'await_user_confirm',
    ]);
  });
});
