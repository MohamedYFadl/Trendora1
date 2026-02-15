//get cart [Used in cart,checkout,product details]
export async function getCart(userEmail) {
    const cart = localStorage.getItem(userEmail);
    return cart ? JSON.parse(cart) : [];
}
//update cart [Used in cart, product details]
export async function updateCart(userEmail, cart) {
    localStorage.setItem(userEmail, JSON.stringify(cart));
}

// merge guest cart to user cart  ==> elsefy
// [Used in login]
export async function mergeGuestCartToUser(userEmail) {
    const guestCart = await getCart("guest");

    if (guestCart.length === 0) return;

    let userCart = await getCart(userEmail);

    guestCart.forEach((guestItem) => {
        const existingItem = userCart.find(
            (uItem) => uItem.productId === guestItem.productId
        );

        if (existingItem) {
            existingItem.qty = (existingItem.qty || 1) + (guestItem.qty || 1);
        } else {
            userCart.push(guestItem);
        }
    });

    await updateCart(userEmail, userCart);

    localStorage.removeItem("guest");
}

// clear cart [Used in checkout]
export async function clearCart(userEmail) {
    localStorage.removeItem(userEmail);
}