import { Sequelize } from "sequelize";

if (!process.env.PSQL_URI) {
	throw new Error("PSQL_URI is not defined");
}	

const sequelize = new Sequelize(process.env.PSQL_URI, {
	dialect: "postgres",
	logging: true,
});


const syncDb = { force: false, alter: true };

sequelize.sync(syncDb).then(() => {
	console.log("DB connected");
}).catch((err) => {
	console.log("Error: ", err);
});

export default sequelize;