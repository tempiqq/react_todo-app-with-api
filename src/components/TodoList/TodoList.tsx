import React from 'react';
import { Todo } from '../../types/Todo';
import { TodoItem } from '../TodoItem';

type TodoListProps = {
  todos: Todo[];
  onDeleteTodo: (todoId: number) => Promise<void>;
  deletingTodoId: number | null;
  onToggleTodo: (todoId: number, completed: boolean) => Promise<void>;
  isUpdatingTodoId: number | null;
  editingTodoId: number | null;
  editingTitle: string;
  onStartEdit: (todoId: number, title: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (todoId: number, title: string) => Promise<void>;
  setEditingTitle: (title: string) => void;
};

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onDeleteTodo,
  deletingTodoId,
  onToggleTodo,
  isUpdatingTodoId,
  editingTodoId,
  editingTitle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  setEditingTitle,
}) => {
  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map(todo => {
        const isDeleting = todo.id === deletingTodoId;
        const isUpdating = todo.id === isUpdatingTodoId;
        const isEditing = todo.id === editingTodoId;

        return (
          <TodoItem
            key={todo.id}
            todo={todo}
            onDeleteTodo={onDeleteTodo}
            isDeleting={isDeleting}
            isUpdating={isUpdating}
            onToggleTodo={onToggleTodo}
            isEditing={isEditing}
            editingTitle={editingTitle}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            setEditingTitle={setEditingTitle}
          />
        );
      })}
    </section>
  );
};
