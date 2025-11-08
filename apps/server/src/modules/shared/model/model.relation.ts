import Note from "../../notes/notes.model";
import WikiLink from "../../notes/wikilink.model";
import User from "../../users/users.model";

User.hasMany(Note, { foreignKey: "user_id", as: "notes", constraints: true, onDelete: "CASCADE" });
Note.belongsTo(User, { foreignKey: "user_id", as: "owner", constraints: true, onDelete: "CASCADE" });
User.hasMany(WikiLink, { foreignKey: "user_id", as: "wikilinks", constraints: true, onDelete: "CASCADE" });
WikiLink.belongsTo(User, { foreignKey: "user_id", as: "owner", constraints: true, onDelete: "CASCADE" });
Note.hasMany(WikiLink, { foreignKey: "parent_note_id", as: "child_wikilinks", constraints: true, onDelete: "CASCADE" });
Note.hasMany(WikiLink, { foreignKey: "child_note_id", as: "parent_wikilinks", constraints: true, onDelete: "CASCADE" });
WikiLink.belongsTo(Note, { foreignKey: "parent_note_id", as: "parent_note", constraints: true, onDelete: "CASCADE" });
WikiLink.belongsTo(Note, { foreignKey: "child_note_id", as: "child_note", constraints: true, onDelete: "CASCADE" });




export {
	WikiLink,
	User,
	Note
};