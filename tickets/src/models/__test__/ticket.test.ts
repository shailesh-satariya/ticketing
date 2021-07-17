import {Ticket} from "../ticket";

it("implements optimistic concurrency control", async () => {
    // Creat an instance of ticket
    const ticket = Ticket.build({
        title: "concert",
        price: 5,
        userId: "123"
    });

    // Save the ticket to the db
    await ticket.save();

    // fetch the ticket twice
    const firstInstance = await Ticket.findById(ticket.id);
    const secondInstance = await Ticket.findById(ticket.id);

    // make two separate changes to the tickets we fetched
    firstInstance!.set({price: 10});
    secondInstance!.set({price: 20});

    // Save the first fetched ticket
    await firstInstance!.save();

    // Save the second fetched ticket and expect an error
    try {
        await secondInstance!.save();
    } catch (err) {
        return;
    }

    throw new Error("Should not return this point!");
});

it("it increments the version on multiple save", async () => {
    const ticket = Ticket.build({
        title: "concert",
        price: 5,
        userId: "123"
    });
    await ticket.save();
    expect(ticket.version).toEqual(0);
    await ticket.save();
    expect(ticket.version).toEqual(1);
    await ticket.save();
    expect(ticket.version).toEqual(2);
});