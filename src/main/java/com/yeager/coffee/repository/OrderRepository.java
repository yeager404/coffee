package com.yeager.coffee.repository;

import com.yeager.coffee.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findAllByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"items", "items.bean"})
    Optional<Order> findWithItemsById(Long id);

    @EntityGraph(attributePaths = {"items", "items.bean"})
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}

/**
 * Spring does NOT care about the “custom” part of the method name.
 * It only cares about the query keyword part.
 *
 * In this method:
 *
 * Optional<Order> findWithItemsById(Long id);
 * Spring ignores findWithItems
 * Spring only parses 👉 ById
 *
 * How Spring Data actually works (internally)
 * Spring Data uses a method-name parser. It scans your method name left → right and looks for reserved keywords.
 * Reserved keywords include:
 * find, read, get

 * By
 * Property names (Id, UserId, CreatedAt)
 * Operators (Between, And, Or, LessThan, etc.)
 * Anything not a keyword is treated as noise for readability.
 *
 * Step-by-step parsing of your method
 * Method name
 * findWithItemsById
 *
 * Spring parses it like this:
 * Part	Meaning
 * find	Query type
 * WithItems	❌ ignored (cosmetic)
 * By	Start of WHERE clause
 * Id	Entity field
 * So Spring internally converts this to:
 * SELECT o FROM Order o WHERE o.id = :id
 * Where do items come from then? 🤔
 * That’s NOT from the method name.
 * That comes from @EntityGraph:
 *
 * @EntityGraph(attributePaths = {"items", "items.bean"})
 * This tells Hibernate:
 * “When you run this query, also JOIN FETCH items and items.bean.”
 * So the query itself is still:
 * WHERE id = ?
 * But the fetch plan is changed.
 * What SQL actually gets generated (conceptually)
 * Without @EntityGraph:
 * SELECT * FROM orders WHERE id = ?
 * -- later: extra queries for items & beans

 * With @EntityGraph:
 *
 * SELECT o, i, b
 * FROM orders o
 * LEFT JOIN order_items i ON i.order_id = o.id
 * LEFT JOIN beans b ON b.id = i.bean_id
 * WHERE o.id = ?
 *
 * ➡ Same filter
 * ➡ More joins
 * ➡ Single query
 * ➡ No N+1 problem
 *
 * Why Spring allows “custom” words at all
 *
 * Because this is more readable:
 *
 * findWithItemsById
 *
 *
 * than this:
 *
 * findById
 *
 *
 * Both generate the same WHERE clause.
 *
 * The difference is:
 *
 * findById → default lazy loading
 *
 * findWithItemsById + @EntityGraph → eager loading (only here)
 *
 * Important Rule (Memorize This)
 *
 * Only the part AFTER By affects the SQL WHERE clause.
 * Everything BEFORE By is just naming sugar.
 *
 * More examples (to lock it in)
 * findOrderById(Long id)
 * findDetailedOrderById(Long id)
 * findWithEverythingLoadedById(Long id)
 *
 *
 * 👉 ALL of these generate:

 * WHERE id = ?
 * Spring does not care. It’s cold and efficient.
 *
 * TL;DR
 *
 * findWithItemsById is not special SQL
 *
 * ById is the only part that matters
 *
 * @EntityGraph controls what gets fetched
 *
 * Method name = filter
 *
 * EntityGraph = fetch strategy
 */