package com.yeager.coffee.event.publisher;


import com.yeager.coffee.config.RabbitMqConfig;
import com.yeager.coffee.event.dto.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;


@Slf4j
@Service
@RequiredArgsConstructor
public class OrderEventPublisher {
    private final RabbitTemplate rabbitTemplate;

    public void publishOrderCreated(OrderCreatedEvent event){
        log.info("Publishing OrderCreatedEvent for Order Id: {}", event.getOrderId());

        //Sends the message to the coffee.orders.exchange wit the routing key "order.created"
        rabbitTemplate.convertAndSend(
                RabbitMqConfig.EXCHANGE_NAME,
                RabbitMqConfig.ROUTING_KEY,
                event
        );
    }
}