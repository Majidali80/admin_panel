"use client";

import React, { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client"; // Assuming your sanity client is properly set up

interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    country: string;
  };
  subscribe: boolean;
}

const CustomerDetails = ({ customerId }: { customerId: string }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) {
      console.error("No customerId provided.");
      return;
    }

    // Fetch customer data from Sanity based on the customerId
    client
      .fetch(
        `*[_type == "order" && customer._id == $customerId][0]{
          customer->{
            firstName,
            lastName,
            email,
            phone,
            address,
            subscribe
          }
        }`,
        { customerId } // Passing customerId as parameter to the query
      )
      .then((data) => {
        if (data && data.customer) {
          setCustomer(data.customer);
        } else {
          console.log("No customer data found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching customer data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [customerId]); // Make sure customerId is available and changes when necessary

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : customer ? (
        <div>
          <p><strong>First Name:</strong> {customer.firstName}</p>
          <p><strong>Last Name:</strong> {customer.lastName}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Phone:</strong> {customer.phone}</p>
          <p><strong>Street Address:</strong> {customer.address.street1}</p>
          {customer.address.street2 && <p><strong>Street Address 2:</strong> {customer.address.street2}</p>}
          <p><strong>City:</strong> {customer.address.city}</p>
          <p><strong>Country:</strong> {customer.address.country}</p>
          <p><strong>Subscribed:</strong> {customer.subscribe ? "Yes" : "No"}</p>
        </div>
      ) : (
        <p>No customer details available.</p>
      )}
    </div>
  );
};

export default CustomerDetails;
