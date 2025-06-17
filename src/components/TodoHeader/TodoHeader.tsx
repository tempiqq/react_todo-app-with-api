import React, { useEffect, useRef } from 'react';
import cn from 'classnames';

type TodoHeaderProps = {
  onAddTodo: (title: string) => Promise<void>;
  newTodoTitle: string;
  setNewTodoTitle: (title: string) => void;
  isAddingTodo: boolean;
  isDeletingAnyTodo: boolean;
  everyTodosCompleted: boolean;
  onToggleAllTodos: () => Promise<void>;
  isTogglingAllTodos: boolean;
  hasTodos: boolean;
  isLoading: boolean;
};

export const TodoHeader: React.FC<TodoHeaderProps> = ({
  onAddTodo,
  newTodoTitle,
  setNewTodoTitle,
  isAddingTodo,
  isDeletingAnyTodo,
  everyTodosCompleted,
  onToggleAllTodos,
  isTogglingAllTodos,
  hasTodos,
  isLoading,
}) => {
  const newFieldFocusRef = useRef<HTMLInputElement>(null);
  const anyProcessingWithTodo =
    isAddingTodo || isDeletingAnyTodo || isTogglingAllTodos;

  useEffect(() => {
    newFieldFocusRef.current?.focus();
  }, [isAddingTodo, isDeletingAnyTodo]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (anyProcessingWithTodo) {
      return;
    }

    await onAddTodo(newTodoTitle);
  };

  const isDisabled = isAddingTodo || isDeletingAnyTodo;

  return (
    <header className="todoapp__header">
      {hasTodos && !isLoading && (
        <button
          type="button"
          className={cn('todoapp__toggle-all ', {
            active: everyTodosCompleted,
          })}
          data-cy="ToggleAllButton"
          onClick={onToggleAllTodos}
          disabled={isDisabled}
        />
      )}

      <form onSubmit={handleSubmit}>
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={newTodoTitle}
          onChange={event => setNewTodoTitle(event.target.value)}
          disabled={isDisabled}
          ref={newFieldFocusRef}
        />
      </form>
    </header>
  );
};
