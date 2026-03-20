const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  'https://qjikrfpojyubzxnfdcsl.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agencyId } = req.body;
  if (!agencyId) return res.status(400).json({ error: 'Missing agencyId' });

  try {
    const { data: agency } = await supabase
      .from('agencies')
      .select('stripe_customer_id')
      .eq('id', agencyId)
      .single();

    if (!agency?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: agency.stripe_customer_id,
      return_url: 'https://www.usemetrik.app/app.html',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Billing portal error:', err);
    res.status(500).json({ error: err.message });
  }
};
