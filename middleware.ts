import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { getStaffRole, ROLE_HOME } from '@/lib/auth/get-staff-role';

/** /portal/admin/* pages that are shared by admin AND super_admin (read + registration actions). */
const SHARED_STAFF_PREFIXES = ['/portal/admin/analytics', '/portal/admin/camps/', '/portal/admin/registrations/'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // getUser() (not getSession()) validates the JWT against Supabase Auth —
  // this is what actually refreshes an expiring session cookie, and it's
  // also the only trustworthy way to know if a session is real (getSession()
  // just reads the cookie without verifying it server-side).
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/portal')) {
    // Not a portal route — just return the (possibly cookie-refreshed)
    // response, no access-control logic applies here.
    return response;
  }

  const isLoginRoute = pathname === '/portal/login';
  const isAcceptInviteRoute = pathname === '/portal/accept-invite';
  const isPasswordResetRoute = pathname === '/portal/forgot-password' || pathname === '/portal/reset-password';

  if (isPasswordResetRoute) {
    // Same reasoning as accept-invite below: these must be reachable with
    // no session (a locked-out user by definition doesn't have one), and
    // reset-password's token lives in a query param the page itself
    // validates against the DB — no auth decision belongs at this layer.
    return response;
  }

  if (isAcceptInviteRoute) {
    // Invite links carry the session token in the URL FRAGMENT
    // (#access_token=...), which browsers never send to the server — so at
    // this point, on a fresh invite click, there is no session cookie yet
    // and `user` will be null even though the link is valid. This route
    // must stay reachable with no session so the client-side JS can run,
    // parse the fragment, and establish the session itself. No redirect
    // logic here at all; the page handles its own expired/invalid states.
    return response;
  }

  if (isLoginRoute) {
    // Already-authenticated staff hitting the login page get bounced
    // straight to their dashboard instead of seeing the form again.
    if (user) {
      const role = await getStaffRole(supabase);
      if (role) {
        return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
      }
    }
    return response;
  }

  // Every other /portal/* route requires a real session. No session ->
  // straight to login, carrying where they were headed.
  if (!user) {
    const loginUrl = new URL('/portal/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Resolve role server-side via the SECURITY DEFINER RPC — this is the
  // actual access-control decision, not a UI hint. A session with no
  // `users` row (shouldn't happen for anyone who reached login, but a
  // revoked/deleted staff account could still hold a live session cookie)
  // is treated as unauthorized, same as no session at all.
  const role = await getStaffRole(supabase);
  if (!role) {
    const loginUrl = new URL('/portal/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Analytics is deliberately shared read-only reporting — both admin and
  // super_admin can view it, unlike the rest of /portal/admin/* (which is
  // strictly admin-only, see below). Carved out before the general admin
  // check so a super_admin session isn't bounced back to their own
  // dashboard just because the URL happens to live under /portal/admin.
  if (SHARED_STAFF_PREFIXES.some((p) => pathname.startsWith(p))) {
    return role === 'admin' || role === 'super_admin' ? response : NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  // Route-level role check. Admin and Super Admin dashboards are strictly
  // separate — an admin session hitting /portal/super-admin/* is redirected
  // to their own dashboard, not shown an error page or the super-admin UI.
  if (pathname.startsWith('/portal/admin')) {
    return role === 'admin' ? response : NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }
  if (pathname.startsWith('/portal/super-admin')) {
    return role === 'super_admin' ? response : NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  // Any other /portal/* path (e.g. a bare /portal, or a future route not
  // yet written) — authenticated staff exists but matches no known
  // sub-route above, so default-deny rather than fall through unrestricted.
  // Send them to their own dashboard instead of a dead end.
  return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
