const Stripe = require('stripe');

const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE,
  pro: process.env.STRIPE_PRO_PRICE,
  agency: process.env.STRIPE_AGENCY_PRICE,
};

const CLIENT_LIMITS = {
  starter: 3,
  pro: 10,
  agency: 999,
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan, agencyId, email } = req.body;

  if (!plan || !PRICE_IDS[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          agencyId,
          plan,
          clientLimit: CLIENT_LIMITS[plan],
        },
      },
      ...(email ? { customer_email: email } : {}),
      metadata: { agencyId, plan },
      success_url: `https://www.usemetrik.app/app.html?checkout=success&plan=${plan}`,
      cancel_url: `https://www.usemetrik.app/app.html?checkout=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
};
