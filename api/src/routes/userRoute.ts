import { Router } from "express";
import { prismaclient } from "../config/prismaConfig";
import { sign } from "jsonwebtoken";
import { Signin, Signup } from "../types/authuser";
const router = Router();



router.post("/signup", async (req, res): Promise<any> => {
  try {
    const { name, email, password, phone_number }: Signup = req.body;
    if (!name || !email || !password || !phone_number) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    const user = await prismaclient.user.findFirst({
      where: {
        email,
      },
    });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    const newUser = await prismaclient.user.create({
      data: {
        name,
        email,
        password,
        phone_number,
      },
    });
    return res.status(200).json({ msg: "User created successfully", newUser });
  } catch (err) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.post("/signin", async (req, res): Promise<any> => {
  try {
    const { email, password }: Signin = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    const user = await prismaclient.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }
    if (user.password !== password) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    const token = sign({ id: user.id }, "secret");
    return res
      .status(200)
      .json({ msg: "User logged in successfully", user, token });
  } catch (err) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

export default router;
