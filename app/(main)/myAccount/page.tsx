'use client'

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import AccountDetails from '@/components/Profile/AccountDetails';
import AddressBook from '@/components/Profile/AddressBook';
import OrderHistory from '@/components/Profile/OrderHistory';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Page() {
  const [activeSection, setActiveSection] = useState('AccountDetails');
  const [mounted, setMounted] = useState(false); // ✅ track if client mounted

  useEffect(() => {
    setMounted(true); // client-only
    const hash = window.location.hash.replace('#', '');
    if (hash === 'orderHistry') setActiveSection('OrderHistory');
    if (hash === 'addressBook') setActiveSection('AddressBook');
    if (hash === 'accountDetails') setActiveSection('AccountDetails');
  }, []);

  if (!mounted) return null; // ✅ render nothing until client

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