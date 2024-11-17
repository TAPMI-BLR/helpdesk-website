import { decodeJwt } from 'jose';

import { Suspense } from 'react';

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { getTicketDetails, getTicketMessages } from '@/lib/actions/tickets';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { NewMessageForm } from './new-message-form';
import { TicketStatus } from './ticket-status';
import { TicketTimeline } from './ticket-timeline';

interface JwtPayload {
  uuid: string;
  email: string;
  name: string;
}

export default async function TicketPage({
  params,
}: {
  params: { id: string };
}) {
  const [messagesData, ticketDetailsData] = await Promise.all([
    getTicketMessages(params.id),
    getTicketDetails(params.id),
  ]);

  if (
    messagesData.status !== 'success' ||
    ticketDetailsData.status !== 'success'
  ) {
    notFound();
  }

  const { ticket } = ticketDetailsData;

  const cookieStore = cookies();
  const token = cookieStore.get('JWT_TOKEN')?.value;
  let currentUserId = null;

  if (token) {
    try {
      const decoded = decodeJwt(token) as JwtPayload;
      currentUserId = decoded.uuid;
    } catch (error) {
      console.error('Error decoding JWT:', error);
    }
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.12))] flex-col pt-4">
      <div className="grid flex-grow grid-cols-3 gap-4 overflow-hidden">
        <div className="col-span-2 flex flex-col overflow-hidden">
          <Card className="flex h-full flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">{ticket.title}</h2>
                <span className="text-sm text-muted-foreground">
                  ID: {ticket.id}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-grow flex-col overflow-hidden">
              <Suspense fallback={<div>Loading messages...</div>}>
                <TicketTimeline
                  messages={messagesData.messages}
                  currentUserId={currentUserId}
                />
              </Suspense>
              <NewMessageForm ticketId={params.id} />
            </CardContent>
          </Card>
        </div>
        <div className="overflow-y-auto">
          <TicketStatus ticket={ticket} />
        </div>
      </div>
    </div>
  );
}