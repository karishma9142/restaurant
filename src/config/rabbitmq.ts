import amqp from 'amqplib';

let channel: amqp.Channel;

export const connectRabbitMq = async () => {
    const connection = await amqp.connect(process.env.RABITMQ_URL!);

    channel = await connection.createChannel();

    await channel.assertQueue(process.env.PAYMENT_QUEUE!, {
        durable: true
    })

    console.log('connected to rabitmq(restaurant)');
}

export const getChannel = () => channel;

