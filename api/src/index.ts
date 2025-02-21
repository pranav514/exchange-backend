import express from "express";
import cors from "cors";
import  userRoute from "./routes/userRoute";
import orderRoute from "./routes/orderRoute";
import depthRoute from "./routes/depthRoute";
import klineRoute from "./routes/klineRoute";
const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/v1/user' , userRoute)
app.use('/api/v1/order' , orderRoute)
app.use('/api/v1/depth' , depthRoute)
app.use('/api/v1/klines', klineRoute)

app.listen(3000 , () => {
    console.log("api started at the port 3000");
})
