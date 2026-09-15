<template>
  <div class="min-h-screen bg-background text-text">
    <NavBar class="sticky top-0 z-10 bg-background" />
    <div class="flex items-center justify-center py-6 md:py-10 px-1 md:px-2 mx-5">
      <div class="w-full max-w-5xl mx-auto bg-background-secondary rounded-xl shadow-lg p-6 md:p-10 border-2 border-secondary shadow-lg shadow-secondary">
        <h1 class="text-2xl md:text-3xl font-extrabold text-primary mb-8 text-center">Refunds & Cancellations</h1>
        <div class="space-y-8 text-base md:text-lg">
          <p>
            Because every commission is a custom, hand-made piece of work, refunds are handled differently from a regular store purchase. This page summarizes the policy; the full details are part of the
            <NuxtLink to="/tos" class="underline decoration-primary hover:text-primary font-semibold">Terms of Service</NuxtLink>.
          </p>
          <ul class="space-y-3 list-disc list-inside">
            <li>
              <span class="font-bold text-primary">Before work begins:</span> you may cancel your order at any time and receive a
              <span class="font-bold">full refund</span>.
            </li>
            <li>
              <span class="font-bold text-primary">After work has begun</span> (but before a draft is delivered): the artist retains
              <span class="font-bold">30%</span> of the amount corresponding to the time already invested; the remainder is refunded.
            </li>
            <li>
              <span class="font-bold text-primary">After the draft has been delivered:</span>
              <span class="text-warning font-bold"> no refund will be issued.</span> Up to 3 free revisions are included to make sure the draft matches your expectations before this point.
            </li>
            <li>
              <span class="font-bold text-primary">Force majeure:</span> if the artist is unable to complete the commission due to circumstances beyond their control, the client receives a
              <span class="font-bold">full refund</span>.
            </li>
            <li>
              <span class="font-bold text-primary">Payment schedule:</span> commissions are paid in two halves &mdash; a deposit before work starts, and the balance before final delivery. The finished build/file is never sent before the final payment is received.
            </li>
            <li>
              Chargebacks or payment disputes opened without contacting the artist first are not considered a valid refund request once work has started.
            </li>
          </ul>
          <p>
            Questions about a specific order? Reach out via
            <a href="mailto:leledanbusiness@gmail.com" class="underline decoration-primary hover:text-primary font-semibold">email</a>
            or Discord and it will be handled on a case-by-case basis.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
