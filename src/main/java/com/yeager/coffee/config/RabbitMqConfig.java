package com.yeager.coffee.config;

import org.springframework.amqp.rabbit.connection.ConnectionFactory;import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {
    public static final String EXCHANGE_NAME = "coffee.orders.exchange";
    public static final String QUEUE_NAME = "ml.ingestion.queue";
    public static final String ROUTING_KEY = "order.created";

    @Bean
    public TopicExchange orderExchange(){
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue mlQueue(){
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    public Binding binding(Queue mlQueue, TopicExchange orderExchange){
        return BindingBuilder.bind(mlQueue).to(orderExchange).with(ROUTING_KEY);
    }

    @Bean
    public JacksonJsonMessageConverter producerJacksonMessageConverter(){
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory){
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(producerJacksonMessageConverter());
        return rabbitTemplate;
    }
}
