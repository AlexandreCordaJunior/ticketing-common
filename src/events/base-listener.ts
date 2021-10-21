import {Message, Stan} from "node-nats-streaming";
import {Subjects} from "./subjects";

interface Event {
    subject: Subjects;
    data: any;
}

export abstract class Listener<T extends Event> {
    protected client: Stan;
    abstract subject: T['subject'];
    abstract queueGroupName: string;
    protected ackWait = 5 * 1000;

    constructor(client: Stan) {
        this.client = client;
    }

    abstract onMessage(data: T['data'], msg: Message): void;

    subscriptionOptions() {
        return this.client
            .subscriptionOptions()
            .setDeliverAllAvailable()
            .setManualAckMode(true)
            .setAckWait(this.ackWait)
            .setDurableName(this.queueGroupName);
    }

    listen() {
        const subscription = this.client.subscribe(
            this.subject,
            this.queueGroupName,
            this.subscriptionOptions()
        );

        subscription.on('message', (msg: Message) => {
            console.log(
                `Message Received: ${this.subject} / ${this.queueGroupName}`
            );

            const parsedData = this.parseMessage(msg);
            this.onMessage(parsedData, msg);
        });
    }

    parseMessage(msg: Message) {
        const data = msg.getData();
        return typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString('utf-8'));
    }
}