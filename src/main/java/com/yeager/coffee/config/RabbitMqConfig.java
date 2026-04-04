package com.yeager.coffee.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ topology:
 *
 *  [OrderService] ──► coffee.orders.exchange (Topic)
 *                          │
 *              ┌───────────┴───────────┐
 *              │ routing: order.created│
 *              ▼                       ▼
 *     ml.ingestion.queue        ml.analytics.queue
 *   (Python training consumer)  (Python real-time consumer)
 *
 * Both queues receive every "order.created" message.
 * Separation lets us evolve consumers independently and
 * dead-letter each queue separately if needed.
 */
@Configuration
public class RabbitMqConfig {

    public static final String EXCHANGE_NAME       = "coffee.orders.exchange";
    public static final String ROUTING_KEY         = "order.created";

    /** Batch training consumer — Python reads here, saves rows, retrains model */
    public static final String ML_INGESTION_QUEUE  = "ml.ingestion.queue";

    /** Real-time analytics consumer — Python updates predictions on every order */
    public static final String ML_ANALYTICS_QUEUE  = "ml.analytics.queue";

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue mlIngestionQueue() {
        // durable=true so messages survive broker restarts
        return QueueBuilder.durable(ML_INGESTION_QUEUE).build();
    }

    @Bean
    public Queue mlAnalyticsQueue() {
        return QueueBuilder.durable(ML_ANALYTICS_QUEUE).build();
    }

    @Bean
    public Binding ingestionBinding(Queue mlIngestionQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(mlIngestionQueue).to(orderExchange).with(ROUTING_KEY);
    }

    @Bean
    public Binding analyticsBinding(Queue mlAnalyticsQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(mlAnalyticsQueue).to(orderExchange).with(ROUTING_KEY);
    }

    @Bean
    public Jackson2JsonMessageConverter producerJacksonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(producerJacksonMessageConverter());
        return rabbitTemplate;
    }
}
