import { getCurrentUserMail } from '../services/auth_services.js';

// get user orders
export async function getUserOrder() {
    const orders = localStorage.getItem('orders');
    const userMail = getCurrentUserMail();
    if (!orders) {
        return [];
    }
    const userOrder = JSON.parse(orders).filter(o => o.email === userMail);
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
    return userOrder.find(o => o.id === id) || [];
}
//creat order
export async function createOrder(order) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
}