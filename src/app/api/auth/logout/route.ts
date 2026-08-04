import { NextResponse } from "next/server";
import { destroySession, getActor } from "@/lib/session";
import { recordEventAs } from "@/lib/events";

export async function POST(request: Request) {
  const actor = await getActor();

  if (actor) {
    await recordEventAs(
      {
        component: "User",
        eventName: "User logged out",
        action: "signed out",
        target: null,
        context: "System",
        description: `The user with id '${actor.user.id}' has signed out.`,
      },
      actor.user.id,
      actor.user.role,
      actor.sessionId
    );
  }

  await destroySession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
