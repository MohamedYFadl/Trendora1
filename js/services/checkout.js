import { getCurrentUserMail } from '../services/auth_services.js';

// get user orders
export async function getUserOrder() {
    const order = localStorage.getItem('order');
    const userMail = getCurrentUserMail();
    if (!order) {
        return [];
    }
    const userOrder = JSON.parse(order).filter(o => o.email === userMail);
    if (!userOrder) {
        return [];
    }
    return userOrder;
}
// get user order by id
export async function getUserOrderById(id) {
    const userOrder = await getUserOrder();
    if (!userOrder) {
        return [];
    }
    return userOrder.find(o => o.id === id);
}
//creat order
export async function createOrder(order) {
    const orders = JSON.parse(localStorage.getItem('order')) || [];
    orders.push(order);
    localStorage.setItem('order', JSON.stringify(orders));
}