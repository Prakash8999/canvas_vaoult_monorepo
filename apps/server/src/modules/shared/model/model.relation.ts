import Note from "../../notes/notes.model";
import WikiLink from "../../notes/wikilink.model";
import User from "../../users/users.model";
import Canvas from "../../canvas/canvas.model";

User.hasMany(Note, { foreignKey: "user_id", as: "notes", constraints: true, onDelete: "CASCADE" });
Note.belongsTo(User, { foreignKey: "user_id", as: "owner", constraints: true, onDelete: "CASCADE" });
User.hasMany(WikiLink, { foreignKey: "user_id", as: "wikilinks", constraints: true, onDelete: "CASCADE" });
WikiLink.belongsTo(User, { foreignKey: "user_id", as: "owner", constraints: true, onDelete: "CASCADE" });
Note.hasMany(WikiLink, { foreignKey: "parent_note_id", as: "child_wikilinks", constraints: true, onDelete: "CASCADE" });
Note.hasMany(WikiLink, { foreignKey: "child_note_id", as: "parent_wikilinks", constraints: true, onDelete: "CASCADE" });
WikiLink.belongsTo(Note, { foreignKey: "parent_note_id", as: "parent_note", constraints: true, onDelete: "CASCADE" });
WikiLink.belongsTo(Note, { foreignKey: "child_note_id", as: "child_note", constraints: true, onDelete: "CASCADE" });

// Canvas relationships
User.hasMany(Canvas, { foreignKey: "user_id", as: "canvases", constraints: true, onDelete: "CASCADE" });
Canvas.belongsTo(User, { foreignKey: "user_id", as: "owner", constraints: true, onDelete: "CASCADE" });
Canvas.belongsTo(Note, { foreignKey: "note_id", as: "note", constraints: false, onDelete: "SET NULL" });
Note.hasOne(Canvas, { foreignKey: "note_id", as: "canvas", constraints: false, onDelete: "SET NULL" });

export {
	WikiLink,
	User,
	Note,
	Canvas
};