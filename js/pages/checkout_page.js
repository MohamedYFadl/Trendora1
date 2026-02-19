import { getCurrentUser } from '../services/auth_services.js';
import { massage } from '../Utilities/helpers.js';
import { createOrder } from '../services/checkout.js';
import * as cartServices from '../services/cart_services.js';
const user = getCurrentUser();
let cart = [];

if (user) {
    cart = await cartServices.getCart(user.email);
    console.log(cart);

} else {
    window.location.hash = '#login';
}

let savedDiscountPercent = JSON.parse(localStorage.getItem('appliedDiscount')) || 0;

(function () {

    // ----- DOM elements -----
    const panels = [document.getElementById('panel1'), document.getElementById('panel2'), document.getElementById('panel3')];
    const stepIndicators = [document.getElementById('step1-indicator'), document.getElementById('step2-indicator'), document.getElementById('step3-indicator')];
    const stepLabels = [document.getElementById('step1-label'), document.getElementById('step2-label'), document.getElementById('step3-label')];
    const stepIcons = [document.getElementById('step1-icon'), document.getElementById('step2-icon'), document.getElementById('step3-icon')];
    const connectors = [document.getElementById('connector1'), document.getElementById('connector2')];

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const stepCounter = document.getElementById('stepCounter');

    // shipping fields
    const fullName = document.getElementById('fullName');
    const mobile = document.getElementById('mobile');
    const email = document.getElementById('email');
    email.value = user.email;
    const region = document.getElementById('region');
    const city = document.getElementById('city');
    const street = document.getElementById('street');
    const building = document.getElementById('building');
    const floor = document.getElementById('floor');
    const zip = document.getElementById('zip');

    // payment radios & card section
    const paymentRadios = document.getElementsByName('paymentMethod');
    const cardSection = document.getElementById('cardDetailsSection');
    const cardNumber = document.getElementById('cardNumber');
    const cardName = document.getElementById('cardName');
    const expiry = document.getElementById('monthPicker');
    const ccv = document.getElementById('ccv');

    // confirmation elements
    const confirmShipping = document.getElementById('confirmShipping');
    const confirmPayment = document.getElementById('confirmPayment');
    const confirmCardExtra = document.getElementById('confirmCardExtra');
    const orders = document.getElementById('orders');
    const totalPrice = document.getElementById("totalPrice");
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const regexCCV = /^[0-9]{3,4}$/
    const errorMessage = document.getElementById("errorMessage");
    // ----- state -----
    let currentStep = 1;            // 1,2,3
    let step1Completed = false;     // whether user has passed step 1 (shipping valid)

    // ----- helper: toggle card details visibility based on selected payment method -----
    function toggleCardDetails() {
        const isCardSelected = Array.from(paymentRadios).find(r => r.checked && r.value === 'card');
        if (isCardSelected) {
            cardSection.classList.remove('hidden');
            cardSection.style.display = 'block';
        } else {
            cardSection.classList.add('hidden');
            cardSection.style.display = 'none';
        }
    }

    // initial hide if cash? but default card is checked, so show. anyway call after DOM ready
    toggleCardDetails();

    // attach event listeners to radios
    paymentRadios.forEach(radio => radio.addEventListener('change', toggleCardDetails));

    // ----- validation for step1 -----
    function isShippingValid() {
        if (!fullName.value.trim()) return false;
        if (!mobile.value.trim()) return false;
        if (!email.value.trim() || !regexEmail.test(email.value.trim()) == true) return false;
        if (!region.value.trim()) return false;
        if (!city.value.trim()) return false;
        if (!street.value.trim()) return false;
        if (!building.value.trim()) return false;
        return true;
    }
    // ----- validation for step2 (payment) -----
    function isPaymentValid() {
        const selectedRadio = Array.from(paymentRadios).find(r => r.checked);
        if (!selectedRadio) return false;

        if (selectedRadio.value === 'card') {
            const cardNum = cardNumber.value.trim();
            const name = cardName.value.trim();
            const exp = expiry.value.trim()
            const cvvVal = ccv.value.trim();

            if (cardNum !== '4242 4242 4242 4242') {
                massage("Please enter a valid card number", "error");
                return false;
            }
            if (!name) {
                massage("Please enter a valid card name", "error");
                return false;
            }
            const expDate = new Date(exp);
            if (!exp || isNaN(expDate.getTime()) || expDate < new Date().setHours(0, 0, 0, 0)) {
                massage("Invalid expiry date", "error");
                return false;
            }
            if (!regexCCV.test(cvvVal)) {
                massage("Invalid CCV number", "error");
                return false;
            }
        }
        return true;
    }
    const total = cart.reduce((sum, item) => {
        const subtotal = item.price * item.qty
        const afterDiscount = subtotal * (1 - item.discountPercentage / 100)
        return sum + afterDiscount;
    }, 0);
    const finalTotal = total * (1 - savedDiscountPercent);
    const shippingPrice = finalTotal < 500 && finalTotal > 0 ? 10 : 0;

    orders.innerHTML = cart.map(item => {
        return `
        <div class="flex justify-between text-sm">
            <div class="flex items-start gap-2">
                <span class="font-medium">${item.qty}x</span>
                <div>
                    <p class="font-medium text-(--main-text)">${item.name}</p>
                    <p class="text-xs text-gray-400">Size: ${item.size}</p>
                </div>
            </div>
            <span class="font-medium">$${item.price * item.qty * (1 - item.discountPercentage / 100)}</span>
        </div>
        `
    }).join('');
    totalPrice.innerHTML = `
                             <div class="flex justify-between">
                                <span class="text-(--main-text)">Subtotal</span>
                                <span class="font-medium">$${total}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-(--main-text)">Discount</span>
                                <span class="font-medium text-green-600">$${total * savedDiscountPercent}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-(--main-text)">Shipping</span>
                                <span class="font-medium text-green-600">${shippingPrice == 0 ? "Free" : shippingPrice + "$"}</span>
                            </div>
                            <div class="flex justify-between text-base font-bold border-t border-gray-300 pt-2 mt-1">
                                <span>Total</span>
                                <span class="text-blue-600">$${finalTotal + shippingPrice}</span>
                            </div>
    
    
    `
    // ----- mark step1 as completed and unlock step2 & step3 styling -----
    function unlockNextSteps() {
        if (!step1Completed && isShippingValid()) {
            step1Completed = true;
            // enable visual unlock: step2 indicator becomes available (gray -> neutral)
            // we refresh stepper based on currentStep, but also override look for step2,3 if step1Completed.
            refreshStepper();
        } else if (step1Completed && !isShippingValid()) {
            // if data becomes invalid again, lock? We decide to keep unlocked once completed, but can also revert.
            // better to keep unlocked, but we can also reflect that step2 is reachable only if valid.
            // we want step2/3 hidden until step1 is done. We'll control via panel activation in goToStep.
        }
    }

    // ----- refresh stepper appearance (colors, connectors, step numbers) -----
    function refreshStepper() {
        // base reset to gray for all
        for (let i = 0; i < stepIndicators.length; i++) {
            const ind = stepIndicators[i];
            const lbl = stepLabels[i];
            const icon = stepIcons[i];
            ind.className = 'w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold border-2 border-gray-200 transition-colors';
            lbl.className = 'text-xs font-medium mt-1 text-gray-500';
            if (icon) icon.innerText = (i + 1).toString();
        }

        // If step1 is not completed, only step1 is active (blue) others remain gray
        if (!step1Completed) {
            // step1 blue (active)
            stepIndicators[0].classList.remove('bg-gray-200', 'border-gray-200', 'text-gray-600');
            stepIndicators[0].classList.add('bg-blue-600', 'border-blue-600', 'text-white');
            stepLabels[0].classList.remove('text-gray-500');
            stepLabels[0].classList.add('text-blue-600');
            // connectors: only first connector may be light blue (pending)
            connectors[0].classList.remove('active-connector', 'bg-green-500', 'bg-blue-300');
            connectors[0].classList.add('bg-blue-200'); // faint
            connectors[1].classList.remove('active-connector', 'bg-green-500', 'bg-blue-300');
            // step2 and step3 labels stay gray, no change
        } else {
            // step1 completed (green)
            stepIndicators[0].classList.remove('bg-gray-200', 'border-gray-200', 'bg-blue-600', 'border-blue-600', 'text-gray-600');
            stepIndicators[0].classList.add('bg-green-600', 'border-green-600', 'text-white');
            stepIcons[0].innerHTML = '<i class="fas fa-check text-xs"></i>';
            stepLabels[0].classList.remove('text-gray-500', 'text-blue-600');
            stepLabels[0].classList.add('text-green-600');

            // now color step2,3 based on currentStep
            if (currentStep >= 2) {
                // step2 current or done
                if (currentStep === 2) {
                    stepIndicators[1].classList.remove('bg-gray-200', 'border-gray-200', 'text-gray-600');
                    stepIndicators[1].classList.add('bg-blue-600', 'border-blue-600', 'text-white');
                    stepLabels[1].classList.remove('text-gray-500');
                    stepLabels[1].classList.add('text-blue-600');
                    stepIcons[1].innerText = '2';
                } else {
                    // step2 completed (since currentStep 3)
                    stepIndicators[1].classList.remove('bg-gray-200', 'border-gray-200', 'bg-blue-600', 'border-blue-600', 'text-gray-600');
                    stepIndicators[1].classList.add('bg-green-600', 'border-green-600', 'text-white');
                    stepIcons[1].innerHTML = '<i class="fas fa-check text-xs"></i>';
                    stepLabels[1].classList.remove('text-gray-500', 'text-blue-600');
                    stepLabels[1].classList.add('text-green-600');
                }
            } else {
                // step2 inactive but unlocked (gray but maybe with slightly darker text)
                stepIndicators[1].classList.remove('bg-blue-600', 'border-blue-600');
                stepIndicators[1].classList.add('bg-gray-200', 'border-gray-200', 'text-gray-600');
                stepLabels[1].classList.add('text-gray-500');
            }

            // step3
            if (currentStep === 3) {
                stepIndicators[2].classList.remove('bg-gray-200', 'border-gray-200', 'text-gray-600');
                stepIndicators[2].classList.add('bg-blue-600', 'border-blue-600', 'text-white');
                stepLabels[2].classList.remove('text-gray-500');
                stepLabels[2].classList.add('text-blue-600');
                stepIcons[2].innerText = '3';
            } else {
                stepIndicators[2].classList.remove('bg-blue-600', 'border-blue-600');
                stepIndicators[2].classList.add('bg-gray-200', 'border-gray-200', 'text-gray-600');
                stepLabels[2].classList.add('text-gray-500');
            }

            // connectors
            connectors[0].classList.remove('bg-blue-200', 'bg-gray-200');
            connectors[0].classList.add('active-connector', 'bg-green-500'); // step1->step2 completed
            if (currentStep === 3) {
                connectors[1].classList.remove('bg-gray-200', 'bg-blue-200');
                connectors[1].classList.add('active-connector', 'bg-green-500'); // step2->step3 completed
            } else if (currentStep === 2) {
                connectors[1].classList.remove('active-connector', 'bg-green-500');
                connectors[1].classList.add('bg-blue-300'); // pending
            } else {
                connectors[1].classList.remove('active-connector', 'bg-green-500', 'bg-blue-300');
            }
        }

        // step counter
        stepCounter.innerText = `Step ${currentStep} of 3`;

        // prev/next button states and text
        prevBtn.disabled = (currentStep === 1);
        if (currentStep === 3) {
            nextBtn.innerHTML = `Confirm <i class="fas fa-check ml-2"></i>`;
        } else {
            nextBtn.innerHTML = `Next <i class="fas fa-arrow-right ml-2"></i>`;
        }

        // show/hide panels
        panels.forEach((panel, idx) => {
            if (idx === currentStep - 1) {
                // extra: only allow panel2/panel3 if step1Completed OR if we are on step1 (idx 0)
                if (idx === 0 || (idx > 0 && step1Completed)) {
                    panel.classList.add('active-panel');
                } else {
                    panel.classList.remove('active-panel');
                }
            } else {
                panel.classList.remove('active-panel');
            }
        });
    }

    // ----- update confirmation summary (step3) -----
    function updateConfirmation() {
        let shippingHtml = `
        <div><span class="font-medium">Full name:</span> ${fullName.value.trim() || '—'}</div>
        <div><span class="font-medium">Mobile:</span> ${mobile.value.trim() || '—'}</div>
        <div><span class="font-medium">Email:</span> ${email.value.trim() || '—'}</div>
        <div><span class="font-medium">Region:</span> ${region.value.trim() || '—'}</div>
        <div><span class="font-medium">City:</span> ${city.value.trim() || '—'}</div>
        <div><span class="font-medium">Street:</span> ${street.value.trim() || '—'}</div>
        <div><span class="font-medium">Building:</span> ${building.value.trim() || '—'}</div>
        <div><span class="font-medium">Floor:</span> ${floor.value.trim() || '—'}</div>
        <div><span class="font-medium">Zip:</span> ${zip.value.trim() || '—'}</div>
      `;
        confirmShipping.innerHTML = shippingHtml;

        let selectedPayment = 'Credit / Debit Card';
        let isCard = true;
        for (let radio of paymentRadios) {
            if (radio.checked) {
                if (radio.value === 'cash') {
                    selectedPayment = 'Cash on delivery';
                    isCard = false;
                } else {
                    selectedPayment = 'Credit / Debit Card';
                }
                break;
            }
        }
        confirmPayment.innerText = selectedPayment;

        // show card extra if card selected and fields filled
        if (isCard) {
            let cardSummary = `Card: **** ${cardNumber.value.trim().slice(-4) || '••••'}`;
            if (cardName.value.trim()) cardSummary += ` · ${cardName.value.trim()}`;
            if (expiry.value.trim()) cardSummary += ` · exp ${expiry.value.trim()}`;
            confirmCardExtra.innerText = cardSummary;
            confirmCardExtra.classList.remove('hidden');
        } else {
            confirmCardExtra.classList.add('hidden');
        }
    }

    // ----- goToStep with locks and validation -----
    function goToStep(step) {
        if (step < 1 || step > 3) return;

        // block if trying to go to step2/3 without step1 completed
        if (step > 1 && !step1Completed) {
            massage('Please complete shipping information first.', "warning");
            return;
        }

        // if moving forward from step1 to step2, validate shipping again (double-check)
        if (step > currentStep) {
            if (currentStep === 1 && step === 2) {
                if (!isShippingValid()) {
                    massage('Please fill in all required shipping fields (Full Name, Mobile, Email, Region, City, Street, Building).', 'error');
                    return;
                }
                // after valid, mark step1Completed (already might be true, but ensure)
                step1Completed = true;
            }
            if (currentStep === 2 && step === 3) {
                if (!isPaymentValid()) {
                    return;
                }
                updateConfirmation(); // prepare summary
            }
        }

        // if moving back, no special lock
        currentStep = step;
        refreshStepper();
    }

    // ----- Event listeners -----
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) goToStep(currentStep - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < 3) {
            goToStep(currentStep + 1);
        } else if (currentStep === 3) {
            // final order placement
            // potentially re-validate everything one last time?
            // Since we are on step 3, step 1 and 2 "should" be valid.
            // But let's leave it as is for now.
            updateConfirmation();
            massage('Order Placed Successfully! Thank you for shopping with us.', 'success');
            const order = {
                id: Date.now(),
                name: fullName.value,
                email: user.email,
                phone: mobile.value,
                address: `${region.value}, ${city.value}, ${street.value}, ${building.value}`,
                paymentMethod: paymentRadios.value,
                orderDate: new Date(),
                orderStatus: 'pending',
                orderTotal: finalTotal + shippingPrice,
                orderItems: cart.map(item => ({
                    ...item,
                    price: item.price * (1 - item.discountPercentage / 100) * (1 - savedDiscountPercent)
                }))
            };
            createOrder(order);
            localStorage.removeItem(user.email);
            localStorage.removeItem('appliedDiscount');

            window.location.hash = `#payment?orderId=${order.id}`;
        }
    });

    // validate shipping on input (to possibly unlock, but not auto-move)
    const shippingInputs = [fullName, mobile, email, region, city, street, building, floor, zip];
    shippingInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (!step1Completed && isShippingValid()) {
                step1Completed = true;
                refreshStepper();
            } else if (step1Completed && !isShippingValid()) {
                // optional: you could decide to keep unlocked; we keep unlocked to avoid frustration, but we can also set step1Completed false
                // however requirement: sections 2 & 3 appear only when step1 done. If we lock again, they disappear.
                // Better to reflect that if shipping becomes invalid after completion, we still allow step2/3? Probably keep unlocked, but we'll lock again.
                // for better UX, I'll set false so step2/3 disappear again.
                step1Completed = false;
                refreshStepper();
                // if currently on step2 or step3, push back to step1
                if (currentStep > 1) {
                    currentStep = 1;
                    refreshStepper();
                }
            }
        });
    });

    // update card details toggle and also if step3 visible, maybe update confirmation
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            toggleCardDetails();
            if (currentStep === 3) updateConfirmation();
        });
    });

    // optional: update confirmation if card fields change
    if (cardNumber) cardNumber.addEventListener('input', () => { if (currentStep === 3) updateConfirmation(); });
    if (cardName) cardName.addEventListener('input', () => { if (currentStep === 3) updateConfirmation(); });
    if (expiry) expiry.addEventListener('input', () => { if (currentStep === 3) updateConfirmation(); });
    if (ccv) ccv.addEventListener('input', () => { if (currentStep === 3) updateConfirmation(); });

    // // Prefill dummy data
    fullName.value = "Mohamed";
    mobile.value = "+20 100 123 4567";
    region.value = "Cairo";
    city.value = "Nasr City";
    street.value = "Abbas El Akkad";
    building.value = "Block 15, apt 4";
    floor.value = "3rd";
    zip.value = "11555";

    cardNumber.value = '4242 4242 4242 4242'
    cardName.value = 'Mohamed'
    expiry.value = '2026-03'
    ccv.value = '123'
    // initially, step1Completed true because prefilled valid? we set based on validation
    step1Completed = isShippingValid(); // true
    refreshStepper();

    // Set minimum to current month (future only)
    window.addEventListener("DOMContentLoaded", () => {
        const input = document.getElementById("monthPicker");
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        input.min = `${year}-${month}`;
    });
})();