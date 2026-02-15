const SECRET_KEY = "my-super-secret-key-123";

export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isValidPassword(password) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{4,}$/;
    return passwordRegex.test(password);
}

export function isValidName(name) {
    return name && name.trim().length >= 3;
}

export function encrypt(text) {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function decrypt(cipherText) {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}
