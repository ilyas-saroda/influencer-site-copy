import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const NotesTab = ({ notes, onAddNote }) => {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNote = () => {
    if (newNote?.trim()) {
      onAddNote(newNote);
      setNewNote('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Team Notes & Communication</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Internal notes visible to team members only
          </p>
        </div>
        {!isAdding && (
          <Button
            variant="default"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setIsAdding(true)}
          >
            Add Note
          </Button>
        )}
      </div>
      {isAdding && (
        <div className="bg-card border border-border rounded-lg p-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e?.target?.value)}
            placeholder="Write your note here..."
            className="w-full min-h-32 px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="default"
              size="sm"
              onClick={handleAddNote}
              disabled={!newNote?.trim()}
            >
              Save Note
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewNote('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {notes?.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Icon name="MessageSquare" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first note to start tracking communication
            </p>
          </div>
        ) : (
          notes?.map((note) => (
            <div key={note?.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="User" size={18} color="var(--color-primary)" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{note?.author}</div>
                    <div className="text-xs text-muted-foreground">{note?.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{note?.date}</div>
                  <div className="text-xs text-muted-foreground">{note?.time}</div>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{note?.content}</p>
              {note?.tags && note?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {note?.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesTab;