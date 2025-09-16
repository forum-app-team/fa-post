import jwt from 'jsonwebtoken';

const payload = {
    sub: "123e4567-e89b-12d3-a456-426614174000",
    role: "normal",
    email: "test@example.com",
    emailVerified: true
};

const token = jwt.sign(payload, "devsecret", { expiresIn: "1h" });
console.log("JWT Token:");
console.log(token);
