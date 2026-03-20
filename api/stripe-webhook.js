const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  'https://qjikrfpojyubzxnfdcsl.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const CLIENT_LIMITS = { starter: 3, pro: 10, agency: 999 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const agencyId = session.metadata?.agencyId;
        const plan = session.metadata?.plan;
        if (!agencyId || !plan) break;

        await supabase.from('agencies').update({
          plan,
          plan_status: 'trialing',
          client_limit: CLIENT_LIMITS[plan] || 3,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('id', agencyId);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const agencyId = sub.metadata?.agencyId;
        if (!agencyId) break;

        const plan = sub.metadata?.plan;
        const status = sub.status; // active, trialing, past_due, canceled

        await supabase.from('agencies').update({
          plan_status: status,
          plan: plan || undefined,
          client_limit: CLIENT_LIMITS[plan] || 3,
        }).eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;

        await supabase.from('agencies').update({
          plan: null,
          plan_status: 'canceled',
          client_limit: 0,
        }).eq('stripe_subscription_id', sub.id);
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: err.message });
  }
};
