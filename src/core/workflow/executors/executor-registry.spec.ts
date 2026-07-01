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

  it('returns null for batch B actions on page profile', () => {
    expect(getWorkflowExecutor('compose_mutation', 'page')).toBeNull();
  });

  it('returns chat executors for batch B mutation actions', () => {
    expect(getWorkflowExecutor('compose_mutation', 'chat')?.action).toBe(
      'compose_mutation',
    );
    expect(getWorkflowExecutor('await_user_confirm', 'chat')?.action).toBe(
      'await_user_confirm',
    );
  });

  it('lists four page executors for batch A', () => {
    expect(listWorkflowExecutors('page').map((row) => row.action)).toEqual([
      'load_page_context',
      'fetch_data',
      'generate_and_push',
      'summarize',
    ]);
  });
});
