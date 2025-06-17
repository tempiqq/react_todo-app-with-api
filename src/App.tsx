/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';

import * as todoServices from './api/todos';
import { ErrorMessage } from './utils/ErrorMessage';
import { FilterStatus } from './utils/FilterStatus';

import { Todo } from './types/Todo';
import { TodoFooter } from './components/TodoFooter';
import { TodoHeader } from './components/TodoHeader';
import { ErrorNotification } from './components/ErrorNotification';
import { TodoItem } from './components/TodoItem';
import { TodoList } from './components/TodoList';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterStatus>(FilterStatus.All);
  const [isLoading, setIsLoading] = useState(true);

  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [deletingTodoId, setDeletingTodoId] = useState<number | null>(null);
  const [isDeletingTodoCompleted, setIsDeletingTodoCompleted] = useState(false);
  const [isUpdatingTodoId, setIsUpdatingTodoId] = useState<number | null>(null);
  const [isTogglingAllTodos, setIsTogglingAllTodos] = useState(false);

  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(
    ErrorMessage.DEFAULT_ERROR,
  );

  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    setErrorMessage(ErrorMessage.DEFAULT_ERROR);
    setIsLoading(true);

    todoServices
      .getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage(ErrorMessage.LOAD_TODOS_FAILED);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (!todoServices.USER_ID) {
    return <UserWarning />;
  }

  const visibleTodos = todos.filter(todo => {
    switch (filter) {
      case FilterStatus.Active:
        return !todo.completed;
      case FilterStatus.Completed:
        return todo.completed;
      case FilterStatus.All:
      default:
        return true;
    }
  });

  const handleAddTodo = async () => {
    const normalizedTitle = newTodoTitle.trim();

    if (!normalizedTitle) {
      setErrorMessage(ErrorMessage.TITLE_EMPTY);

      return;
    }

    setErrorMessage(ErrorMessage.DEFAULT_ERROR);

    const newTempTodo: Todo = {
      id: 0,
      userId: todoServices.USER_ID,
      title: normalizedTitle,
      completed: false,
    };

    setTempTodo(newTempTodo);

    try {
      const addedTodo = await todoServices.addTodo(normalizedTitle);

      setTodos(prevTodos => [...prevTodos, addedTodo]);
      setNewTodoTitle('');
    } catch (error) {
      setErrorMessage(ErrorMessage.ADD_TODO_FAILED);
    } finally {
      setTempTodo(null); // додати useRef для фокусу сюди і в App
      //if (newFieldFocusRef.current) {newFieldFocusRef.current.focus()}
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setDeletingTodoId(id);
    setErrorMessage(ErrorMessage.DEFAULT_ERROR);

    try {
      await todoServices.deleteTodo(id);
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    } catch (error) {
      setErrorMessage(ErrorMessage.DELETE_TODO_FAILED);
    } finally {
      setDeletingTodoId(null);
    }
  };

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed);

    setErrorMessage(ErrorMessage.DEFAULT_ERROR);
    setIsDeletingTodoCompleted(true);

    const deletePromises = completedTodos.map(todo =>
      todoServices.deleteTodo(todo.id),
    );

    try {
      const result = await Promise.allSettled(deletePromises);
      const deletedTodoIds: number[] = [];
      let hasError = false;

      result.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          deletedTodoIds.push(completedTodos[index].id);
        } else {
          hasError = true;
        }
      });

      setTodos(prevTodos =>
        prevTodos.filter(todo => !deletedTodoIds.includes(todo.id)),
      );

      if (hasError) {
        setErrorMessage(ErrorMessage.DELETE_TODO_FAILED);
      }
    } catch (error) {
      setErrorMessage(ErrorMessage.DELETE_TODO_FAILED);
    } finally {
      setIsDeletingTodoCompleted(false);
    }
  };

  const handleUpdateTodo = async (id: number, completed: boolean) => {
    setIsUpdatingTodoId(id);
    setErrorMessage(ErrorMessage.DEFAULT_ERROR);

    try {
      const updatedTodo = await todoServices.updateTodo(id, { completed });

      setTodos(prevTodos =>
        prevTodos.map(todo => (todo.id === id ? updatedTodo : todo)),
      );
    } catch (error) {
      setErrorMessage(ErrorMessage.UPDATE_TODO_FAILED);
    } finally {
      setIsUpdatingTodoId(null);
    }
  };

  const everyTodosCompleted =
    todos.length > 0 && todos.every(todo => todo.completed);

  const handleToggleAllTodos = async () => {
    setIsTogglingAllTodos(true);
    setErrorMessage(ErrorMessage.DEFAULT_ERROR);

    const targetStatus = everyTodosCompleted ? false : true;
    const todoToUpdate = todos.filter(todo => todo.completed !== targetStatus);

    if (!todoToUpdate.length) {
      setIsTogglingAllTodos(false);

      return;
    }

    const updatePromises = todoToUpdate.map(todo =>
      todoServices.updateTodo(todo.id, { completed: targetStatus }),
    );

    try {
      const result = await Promise.allSettled(updatePromises);
      const updatedTodosId: number[] = [];
      let hasError = false;

      result.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          updatedTodosId.push(todoToUpdate[index].id);
        } else {
          hasError = true;
        }
      });

      setTodos(prevTodos =>
        prevTodos.map(todo =>
          updatedTodosId.includes(todo.id)
            ? { ...todo, completed: targetStatus }
            : todo,
        ),
      );

      if (hasError) {
        setErrorMessage(ErrorMessage.UPDATE_TODO_FAILED);
      }
    } catch (error) {
      setErrorMessage(ErrorMessage.UPDATE_TODO_FAILED);
    } finally {
      setIsTogglingAllTodos(false);
    }
  };

  const handleStartEditing = (todoId: number, title: string) => {
    setEditingTodoId(todoId);
    setEditingTitle(title);
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setEditingTitle('');
  };

  const handleSaveEdit = async (todoId: number, newTitle: string) => {
    const normalizedTitle = newTitle.trim();
    const originalTodo = todos.find(todo => todo.id === todoId);

    if (!originalTodo) {
      return;
    }

    if (normalizedTitle === originalTodo.title) {
      handleCancelEdit();

      return;
    }

    if (!normalizedTitle) {
      // handleCancelEdit();
      await handleDeleteTodo(todoId);

      return;
    }

    setIsUpdatingTodoId(todoId);
    setErrorMessage(ErrorMessage.DEFAULT_ERROR);

    try {
      const updatedTodo = await todoServices.updateTodo(todoId, {
        title: normalizedTitle,
      });

      setTodos(prevTodos =>
        prevTodos.map(todo => (todo.id === todoId ? updatedTodo : todo)),
      );
      handleCancelEdit();
    } catch (error) {
      setErrorMessage(ErrorMessage.UPDATE_TODO_FAILED);
    } finally {
      setIsUpdatingTodoId(null);
    }
  };

  const isAddingTodo = tempTodo !== null;
  const activeTodosCount = todos.filter(todo => !todo.completed).length;
  const showFooter = todos.length > 0;
  const isDeletingAnyTodo =
    deletingTodoId !== null || isDeletingTodoCompleted || isTogglingAllTodos;

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <TodoHeader
          onAddTodo={handleAddTodo}
          newTodoTitle={newTodoTitle}
          setNewTodoTitle={setNewTodoTitle}
          isAddingTodo={isAddingTodo}
          isDeletingAnyTodo={isDeletingAnyTodo}
          everyTodosCompleted={everyTodosCompleted}
          onToggleAllTodos={handleToggleAllTodos}
          isTogglingAllTodos={isTogglingAllTodos}
          hasTodos={todos.length > 0}
          isLoading={isLoading}
        />
        <TodoList
          todos={visibleTodos}
          onDeleteTodo={handleDeleteTodo}
          deletingTodoId={deletingTodoId}
          onToggleTodo={handleUpdateTodo}
          isUpdatingTodoId={isUpdatingTodoId}
          editingTodoId={editingTodoId}
          editingTitle={editingTitle}
          onStartEdit={handleStartEditing}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          setEditingTitle={setEditingTitle}
        />

        {isAddingTodo && (
          <TodoItem key="temp-todo-loader" todo={tempTodo} isTemp={true} />
        )}

        {showFooter && (
          <TodoFooter
            activeTodosCount={activeTodosCount}
            filter={filter}
            setFilter={setFilter}
            onClearCompleted={handleClearCompleted}
            totalTodos={todos.length}
          />
        )}
      </div>

      <ErrorNotification
        message={errorMessage}
        onClose={() => setErrorMessage(ErrorMessage.DEFAULT_ERROR)}
      />
    </div>
  );
};
