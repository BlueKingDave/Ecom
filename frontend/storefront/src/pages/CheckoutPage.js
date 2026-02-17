import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getSessionId, clearSession } from '@/lib/session';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Checkbox } from '@ecom/ui';
import { formatPrice } from '@/lib/utils';
const shippingSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().min(5, 'Postal code is required'),
    country: z.string().min(2, 'Country is required'),
    sameAsBilling: z.boolean().optional(),
});
export function CheckoutPage() {
    const navigate = useNavigate();
    const sessionId = getSessionId();
    const { data: cart, isLoading: cartLoading } = useQuery({
        queryKey: ['cart', sessionId],
        queryFn: () => api.getCart(sessionId),
    });
    const { register, handleSubmit, watch, formState: { errors }, } = useForm({
        resolver: zodResolver(shippingSchema),
        defaultValues: {
            country: 'United States',
            sameAsBilling: true,
        },
    });
    const sameAsBilling = watch('sameAsBilling');
    const createOrderMutation = useMutation({
        mutationFn: (data) => {
            const shippingAddress = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
                country: data.country,
            };
            return api.createOrder({
                items: cart?.items || [],
                shippingAddress,
                billingAddress: sameAsBilling ? shippingAddress : undefined,
            });
        },
        onSuccess: (order) => {
            clearSession();
            navigate(`/order-confirmation/${order.id}`);
        },
    });
    const onSubmit = (data) => {
        createOrderMutation.mutate(data);
    };
    if (cartLoading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-8", children: _jsx("div", { className: "text-center", children: "Loading checkout..." }) }));
    }
    if (!cart || cart.items.length === 0) {
        navigate('/cart');
        return null;
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsx("h1", { className: "text-4xl font-bold mb-8", children: "Checkout" }), _jsx("form", { onSubmit: handleSubmit(onSubmit), children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Shipping Information" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "firstName", children: "First Name *" }), _jsx(Input, { id: "firstName", ...register('firstName'), "aria-invalid": !!errors.firstName, "aria-describedby": errors.firstName ? 'firstName-error' : undefined }), errors.firstName && (_jsx("p", { id: "firstName-error", role: "alert", className: "text-sm text-destructive mt-1", children: errors.firstName.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "lastName", children: "Last Name *" }), _jsx(Input, { id: "lastName", ...register('lastName'), "aria-invalid": !!errors.lastName, "aria-describedby": errors.lastName ? 'lastName-error' : undefined }), errors.lastName && (_jsx("p", { id: "lastName-error", role: "alert", className: "text-sm text-destructive mt-1", children: errors.lastName.message }))] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", children: "Email *" }), _jsx(Input, { id: "email", type: "email", ...register('email'), "aria-invalid": !!errors.email, "aria-describedby": errors.email ? 'email-error' : undefined }), errors.email && (_jsx("p", { id: "email-error", role: "alert", className: "text-sm text-destructive mt-1", children: errors.email.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: "Phone *" }), _jsx(Input, { id: "phone", type: "tel", ...register('phone'), "aria-invalid": !!errors.phone, "aria-describedby": errors.phone ? 'phone-error' : undefined }), errors.phone && (_jsx("p", { id: "phone-error", role: "alert", className: "text-sm text-destructive mt-1", children: errors.phone.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "address", children: "Street Address *" }), _jsx(Input, { id: "address", ...register('address'), "aria-invalid": !!errors.address, "aria-describedby": errors.address ? 'address-error' : undefined }), errors.address && (_jsx("p", { id: "address-error", role: "alert", className: "text-sm text-destructive mt-1", children: errors.address.message }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "city", children: "City *" }), _jsx(Input, { id: "city", ...register('city'), "aria-invalid": !!errors.city, "aria-describedby": errors.city ? 'city-error' : undefined }), errors.city && (_jsx("p", { id: "city-error", role: "alert", className: "text-sm text-destructive mt-1", children: errors.city.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "state", children: "State *" }), _jsx(Input, { id: "state", ...register('state'), "aria-invalid": !!errors.state, "aria-describedby": errors.state ? 'state-error' : undefined }), errors.state && (_jsx("p", { id: "state-error", role: "alert", className: "text-sm text-destructive mt-1", children: errors.state.message }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "postalCode", children: "Postal Code *" }), _jsx(Input, { id: "postalCode", ...register('postalCode'), "aria-invalid": !!errors.postalCode, "aria-describedby": errors.postalCode ? 'postalCode-error' : undefined }), errors.postalCode && (_jsx("p", { id: "postalCode-error", role: "alert", className: "text-sm text-destructive mt-1", children: errors.postalCode.message }))] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "country", children: "Country *" }), _jsx(Input, { id: "country", ...register('country'), "aria-invalid": !!errors.country, "aria-describedby": errors.country ? 'country-error' : undefined }), errors.country && (_jsx("p", { id: "country-error", role: "alert", className: "text-sm text-destructive mt-1", children: errors.country.message }))] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Billing Information" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "sameAsBilling", ...register('sameAsBilling') }), _jsx(Label, { htmlFor: "sameAsBilling", className: "text-sm font-normal cursor-pointer", children: "Same as shipping address" })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Payment Information" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-muted-foreground", children: "Payment processing will be integrated in Task #10 (Stripe plugin). For now, orders will be created in pending status." }) })] })] }), _jsx("div", { className: "lg:col-span-1", children: _jsxs(Card, { className: "sticky top-4", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Order Summary" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "space-y-3 max-h-60 overflow-y-auto", children: cart.items.map((item) => (_jsxs("div", { className: "flex gap-3 text-sm", children: [_jsx("div", { className: "w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden", children: item.image ? (_jsx("img", { src: item.image, alt: item.name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center text-muted-foreground text-xs", children: "No image" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium truncate", children: item.name }), _jsxs("p", { className: "text-muted-foreground", children: ["Qty: ", item.quantity] })] }), _jsx("div", { className: "text-right", children: _jsx("p", { className: "font-medium", children: formatPrice((parseFloat(item.price) * item.quantity).toFixed(2)) }) })] }, item.productId))) }), _jsxs("div", { className: "border-t pt-4 space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Subtotal" }), _jsx("span", { children: formatPrice(cart.subtotal) })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Shipping" }), _jsx("span", { children: "Free" })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Tax" }), _jsx("span", { children: "$0.00" })] }), _jsxs("div", { className: "flex justify-between font-bold text-lg border-t pt-2", children: [_jsx("span", { children: "Total" }), _jsx("span", { children: formatPrice(cart.subtotal) })] })] }), _jsx(Button, { type: "submit", size: "lg", className: "w-full", disabled: createOrderMutation.isPending, children: createOrderMutation.isPending ? 'Processing...' : 'Place Order' }), createOrderMutation.isError && (_jsx("p", { className: "text-sm text-destructive text-center", children: "Failed to create order. Please try again." }))] })] }) })] }) })] }));
}
