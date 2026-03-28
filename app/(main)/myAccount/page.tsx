'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useAuthModal } from "@/context/auth-modal-context";

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AccountDetails from '@/components/Profile/AccountDetails';
import AddressBook from '@/components/Profile/AddressBook';
import OrderHistory from '@/components/Profile/OrderHistory';

export default function Page() {
  const [activeSection, setActiveSection] = useState('AccountDetails');
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const { openModal } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    // Handle redirect & modal if not authenticated or not a 'user'
    if (status !== 'loading') {
      if (!session || session.user.role !== 'user') {
        router.push('/');
        openModal();
      }
    }

    // Set tab from hash
    const hash = window.location.hash.replace('#', '');
    if (hash === 'orderHistry') setActiveSection('OrderHistory');
    if (hash === 'addressBook') setActiveSection('AddressBook');
    if (hash === 'accountDetails') setActiveSection('AccountDetails');
  }, [status, session, router, openModal]);

  if (!mounted) return null;

  // Optionally, you can show a loader while checking auth
  if (status === 'loading' || !session || session.user.role !== 'user') {
    return null; // or <div>Loading...</div>
  }

  return (
    <div className='space-y-4'>
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className='flex space-x-2'>
          <TabsTrigger value="AccountDetails" className={activeSection === 'AccountDetails' ? 'bg-gray-200' : ''}>
            Account Details
          </TabsTrigger>
          <TabsTrigger value="AddressBook" className={activeSection === 'AddressBook' ? 'bg-gray-200' : ''}>
            Address Book
          </TabsTrigger>
          <TabsTrigger value="OrderHistory" className={activeSection === 'OrderHistory' ? 'bg-gray-200' : ''}>
            Order History
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="AccountDetails">
            <AccountDetails />
          </TabsContent>
          <TabsContent value="AddressBook">
            <AddressBook />
          </TabsContent>
          <TabsContent value="OrderHistory">
            <OrderHistory />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}