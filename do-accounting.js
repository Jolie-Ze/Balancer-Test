const process = require("process");
const { ledgerManager } = require("./util");

const [, , txUrl] = process.argv;

const main = async () => {
  const ledgerResult = await ledgerManager.reloadLedger();
  if (ledgerResult.error) {
    return {
      type: "FAILURE",
      error: `Error processing ledger events: ${ledgerResult.error}`,
    };
  }
  const treasuryId = ledgerManager.ledger.accountByName("Treasury").identity.id;
  ledgerManager.ledger.activate(treasuryId);
  const distributions = Array.from(ledgerManager.ledger.distributions());
  const { allocations } = distributions[distributions.length - 1];
  for (let { receipts } of allocations) {
    for (let { id } of receipts) {
      const amount = ledgerManager.ledger.account(id).balance;
      if (Number(amount) > 0 && id !== treasuryId) {
        ledgerManager.ledger.activate(id);

        ledgerManager.ledger.transferGrain({
          from: id,
          to: treasuryId,
          amount,
          memo: txUrl,
        });
      }
    }
  }

  await ledgerManager.persist();
};

main();
