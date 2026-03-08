import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    const { name, surname, email, password } = req.body;

    try {
        // Basic validation
        if (!name || !surname || !email || !password) {
            return  res.status(400).json({ message: "Please fill in all fields"});
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email});
        if (existingUser) {
            return res.status(400).json({ message: "User already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ name, surname, email, password: hashedPassword });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const userObj = user.toObject();
        delete userObj.password;

        res.status(201).json({ token, user: userObj });

    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill in all fields"});
        }

        // Check if user exists (include password for comparison)
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials"});
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const userObj = user.toObject();
        delete userObj.password;

        res.json({ token, user: userObj });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};