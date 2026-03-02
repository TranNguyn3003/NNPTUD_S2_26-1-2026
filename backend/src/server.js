const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const { connectDB } = require('./libs/db');
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

const roleRoute = require('./routes/roleRoute')
const userRoute = require('./routes/userRoute')

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));



app.use(express.json());
app.use(cookieParser());
app.use('/api/role', roleRoute)
app.use('/api/user', userRoute)
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
});