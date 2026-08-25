import mongoose from "mongoose";
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            dbName: "cravio",
        });
        console.log("db is connected");
    }
    catch (error) {
        console.log(`db connection is failed ${error}`);
    }
};
export default connectDB;
