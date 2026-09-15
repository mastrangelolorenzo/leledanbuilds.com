<template>
  <div class="min-h-screen bg-background text-text">
    <NavBar class="sticky top-0 z-10 bg-background" />
    <div class="flex items-center justify-center py-6 md:py-10 px-1 md:px-2 mx-5">
      <div class="w-full max-w-5xl mx-auto bg-background-secondary rounded-xl shadow-lg p-6 md:p-10 border-2 border-secondary shadow-lg shadow-secondary">
        <h1 class="text-2xl md:text-3xl font-extrabold text-primary mb-8 text-center">Terms of Service (TOS)</h1>
        <ol class="space-y-8 text-base md:text-lg">
          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">1. Commitment</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>All requests will be reviewed and must comply with these Terms of Service.</li>
              <li>Projects are hand-picked: the artist chooses which projects to work on. Some requests may be declined without justification.</li>
              <li>Once accepted, the client will receive an order confirmation and can follow progress via direct message.</li>
              <li>The client must provide all necessary information and references before work begins (images, description, desired style, etc). It's recommended to gather everything in a single file/folder (PDF, Google Docs, Drive).</li>
              <li>The client grants the artist a non-exclusive right to use the references solely for the execution of the work and guarantees they hold all rights to them.</li>
              <li>The artist works in good faith and with dedication, guaranteeing originality. Commercially licensed materials, educational tools or copyright-free resources may be used.</li>
              <li>The artist reserves the right to decline requests containing offensive or illegal content, or content that does not match the requested style or theme.</li>
            </ul>
          </li>
          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">2. Deadlines and Process</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>Standard delivery time: 2-7 business days (depending on complexity and queue length).</li>
              <li>The client receives an initial draft for approval before payment.</li>
              <li>The artist provides voluntary updates; the client may request progress reports but not daily interruptions of the work.</li>
              <li>Final delivery happens via Discord, Telegram or email in <span class="font-mono">.schem</span> format. Only the final exported version is provided.</li>
              <li>Any changes to deadlines will be communicated in advance.</li>
            </ul>
          </li>
          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">3. Content Restrictions</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>The artist does not accept work that includes: sexually explicit content, extreme gore, offensive or discriminatory themes, misuse of real images, or direct reproduction of other artists' styles or works.</li>
            </ul>
          </li>
          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">4. Revisions and Changes</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>Up to <span class="font-bold">3 draft revisions</span> included at no extra cost.</li>
              <li>After the final work is approved, only <span class="italic">minor</span> corrections (color, small details) are free.</li>
              <li>Major or excessive changes may incur extra costs, communicated before the work is carried out.</li>
              <li>The final work may not be altered or redesigned without the artist's permission.</li>
            </ul>
          </li>
          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">5. Communication</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>Communication only via Discord, Telegram or email.</li>
              <li>Artist response time: up to 3 business days.</li>
              <li>If the client does not respond for more than 7 days without prior notice, the project may be declared abandoned (no refund).</li>
            </ul>
          </li>
          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">6. Usage Rights</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>By default, the artist retains all copyright and promotional rights; the work may be shown in the portfolio/social media unless confidentiality is requested.</li>
              <li>The client is entitled to personal use (including for profit).</li>
              <li>Exclusivity or transfer of rights must be agreed <span class="italic">in advance and in writing</span>.</li>
              <li><span class="text-warning font-bold">⚠️ Purchase does not grant rights to the source file or to modify it.</span> Builds are delivered as <span class="font-mono">.schematic/.schem</span>; skins as <span class="font-mono">.png</span>.</li>
            </ul>
          </li>
          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">7. Payment</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>Accepted payment methods: <span class="font-mono">PayPal</span> or bank transfer.</li>
              <li>Payment is only made after the draft has been approved.</li>
              <li>Orders unpaid 48 hours after the invoice is sent may be cancelled.</li>
              <li>Prices are set in EUR and may vary depending on complexity and deadlines.</li>
              <li>Payment is split into two halves: the first as a deposit before the service begins, and the second at the end of the service (the build will NOT be delivered before the final payment).</li>
              <li>The client may not request an unjustified refund (chargeback) after work has begun.</li>
            </ul>
          </li>

          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">8. Cancellations and Refunds</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>The client may cancel the order <span class="font-bold">before work begins</span> and receive a full refund.</li>
              <li>If cancellation happens <span class="font-bold">after work has begun</span>, the artist will retain <span class="font-bold">30%</span> of the amount corresponding to the time invested.</li>
              <li>After the <span class="font-bold">draft has been delivered</span>, <span class="text-warning font-bold">no refund will be issued</span>.</li>
              <li>If the artist is unable to complete the work due to force majeure, the client will receive a <span class="font-bold">full refund</span>.</li>
              <li>The artist <span class="font-bold">will not add the client to any public block or ban lists</span>.</li>
              <li>For a summary of this policy, see the dedicated <NuxtLink to="/refunds" class="underline decoration-primary hover:text-primary font-semibold">Refunds page</NuxtLink>.</li>
            </ul>
          </li>

          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">9. Confidentiality</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>Personal or contact information exchanged between the client and the artist is considered strictly confidential and will not be shared without explicit authorization.</li>
              <li>The client may request <span class="font-bold">full confidentiality</span> for the work for an additional fee. In this case, the piece will not be published or shown in the artist's portfolio/social media.</li>
              <li>If full confidentiality is not requested, the artist may publish or showcase the work <span class="font-bold">30 days after delivery</span>, unless otherwise agreed in writing.</li>
            </ul>
          </li>

          <li>
            <h2 class="font-bold text-primary mb-2 text-xl">10. Acceptance of Agreement</h2>
            <ul class="space-y-1 list-disc list-inside">
              <li>By placing an order, the client confirms they have read and fully accept all terms and conditions in this agreement.</li>
              <li>The agreement takes effect from the <span class="font-bold">first communication</span> (e.g. message, form or payment).</li>
              <li>The client declares they are at least <span class="font-bold">18 years old</span> or represented by a legal guardian authorized to enter into contracts.</li>
              <li>The agreement date coincides with the date of the first meaningful interaction between the parties (contact, order confirmation or initial payment).</li>
              <li class="text-warning"><span class="font-bold">Note:</span> Agencies, companies or other organizations are invited to contact the artist directly before ordering to agree on additional details and specific conditions.</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>
