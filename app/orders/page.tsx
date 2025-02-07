"use client";

import React, { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import Swal from "sweetalert2";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import Sidebar from "../components/sidebar/page";

interface OrderData {
  _id: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
      street1: string;
      city: string;
      country: string;
    };
    subscribe: boolean;
    
  };
  items: {
    _key: string;
    product: {
      title: string;
      productImage: { asset: { url: string } };
    };
    quantity: number;
    price: number;
  }[];
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  orderDate: string;
  notes: string;
  status: string | null;
  cartItems: { product: string; productImage: string }[] | null;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await client.fetch(`
          *[_type == "order"]{
            _id,
            customer {
              firstName,
              lastName,
              email,
              phone,
              address,
              city,
              subscribe,
              
            },
            items[] {
              _key,
              product-> {
                title,
                productImage { asset-> { url } }
              },
              quantity,
              price
            },
            paymentMethod,
            subtotal,
            shipping,
            discount,
            total,
            orderDate,
            notes,
            status,
            cartItems[]-> {
              product-> { title, productImage { asset-> { url } } }
            }
          }
        `);
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = filter === "All" ? orders : orders.filter(order => order.status === filter);

  const toggleOrderDetails = (orderId: string) => {
    setSelectedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const handleDelete = async (orderId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await client.delete(orderId);
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      Swal.fire("Deleted!", "Your order has been deleted.", "success");
    } catch (error) {
      Swal.fire("Error!", "Something went wrong while deleting.", "error");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await client.patch(orderId).set({ status: newStatus }).commit();
      setOrders(prevOrders =>
        prevOrders.map(order => (order._id === orderId ? { ...order, status: newStatus } : order))
      );
      Swal.fire(`${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, `The order is now ${newStatus}.`, "success");
    } catch (error) {
      Swal.fire("Error!", "Something went wrong while updating the status.", "error");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg font-semibold">Loading...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 text-white p-0 hidden md:block">
          <Sidebar />
        </div>
        
        {/* Orders Table */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">ORDERS DETAILS</h2>
          <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 text-sm lg:text-base">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Address</th>
                   <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map(order => (
                  <React.Fragment key={order._id}>
                    <tr className="cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleOrderDetails(order._id)}>
                      <td>{order._id}</td>
                      <td>{order.customer.firstName} {order.customer.lastName}</td>
                      <td>{order.customer.address.street1}, {order.customer.address.city}</td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td>${order.total}</td>
                      <td>
                        <select
                          value={order.status || ""}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="bg-gray-200 p-1 rounded"
                        >
                          <option value="pending">Pending</option>
                          <option value="dispatch">Dispatch</option>
                          <option value="success">Completed</option>
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(order._id);
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-800 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {selectedOrderId === order._id && (
                      <tr>
                        <td colSpan={7} className="bg-gray-100 p-4">
                          <h3 className="font-bold text-lg">Order Details</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <p><strong>Email:</strong> {order.customer.email}</p>
                            <p><strong>Phone:</strong> {order.customer.phone}</p>
                            <p><strong>City:</strong> {order.customer.address.city}</p>
                            <p><strong>Country:</strong> {order.customer.address.country}</p>
                            <p><strong>Discount:</strong> {order.discount}</p>
                            <p><strong>Comments:</strong> {order.notes}</p>
                            <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                            <p><strong>Country:</strong> {order.shipping}</p>
                             <p><strong>Subscribe:</strong> {order.customer.subscribe ? 'Yes' : 'No'}</p>
                          </div>
                          <h4 className="mt-4 font-semibold">Products:</h4>
      <ul>
        {order.items.map((item, index) => (
          <li key={`${order._id}-${index}`} className="flex items-center gap-4">
            <div>
              <strong>{item.product.title}</strong> {/* Product Title */}
              <div className="flex items-center gap-2">
                <Image
                  src={item.product.productImage.asset.url} // Image URL
                  alt={item.product.title}
                  width={48}
                  height={48}
                  className="rounded-md"
                />
                <strong>{item?.product?.title || "No Title Available"}</strong>
                <span>Quantity: {item.quantity}</span> {/* Quantity */}
                <span>Price: ${item.price}</span> {/* Price */}
              </div>
            </div>
          </li>
        ))}
      </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
