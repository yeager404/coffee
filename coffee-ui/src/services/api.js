const BASE_URL = "/api";

function getHeaders() {
    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        throw new Error("Login failed");
    }
    return res.json();
}

export async function register(userData) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    });
    if (!res.ok) {
        throw new Error("Registration failed");
    }
    return res.json();
}

export async function getBeans() {
    const res = await fetch(`${BASE_URL}/beans`);
    if (!res.ok) {
        throw new Error("Failed to fetch beans");
    }
    return res.json();
}

export async function createBean(beanData) {
    const res = await fetch(`${BASE_URL}/beans`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(beanData),
    });
    if (!res.ok) {
        throw new Error("Failed to create bean");
    }
    return res.json();
}

export async function addStock(beanId, amountKg) {
    const res = await fetch(`${BASE_URL}/beans/${beanId}/stock?amountKg=${amountKg}`, {
        method: "PATCH",
        headers: getHeaders(),
    });
    if (!res.ok) {
        throw new Error("Failed to add stock");
    }
    return res.json();
}

export async function placeOrder(orderItems, location) {
    const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ items: orderItems, location }),
    });
    if (!res.ok) {
        throw new Error("Failed to place order");
    }
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
}

export async function getOrders(page = 0, size = 10, sort = "createdAt,desc") {
    const res = await fetch(`${BASE_URL}/orders?page=${page}&size=${size}&sort=${sort}`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
}

export async function getDemandSummary(from, to) {
    let url = `${BASE_URL}/analytics/demand`;
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch demand summary");
    return res.json();
}

export async function getDemandByLocation(location, from, to) {
    let url = `${BASE_URL}/analytics/demand/${location}`;
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch demand by location");
    return res.json();
}

export async function getLatestPredictions() {
    const res = await fetch(`${BASE_URL}/analytics/predictions`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch predictions");
    return res.json();
}

export async function getPredictionHistory(beanId, location = "") {
    let url = `${BASE_URL}/analytics/predictions/${beanId}`;
    if (location) {
        url += `?location=${location}`;
    }
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch prediction history");
    return res.json();
}

export async function getAdminPredictionAlerts() {
    const res = await fetch(`${BASE_URL}/admin/predictions`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch admin prediction alerts");
    return res.json();
}
