
USE MySaves;
DELIMITER //
CREATE TRIGGER process_transaction
AFTER INSERT ON trading_transactions
FOR EACH ROW
BEGIN
    DECLARE current_qty DECIMAL(18,8) DEFAULT 0;
    DECLARE current_avg DECIMAL(15,8) DEFAULT 0;
    DECLARE new_qty DECIMAL(18,8);
    DECLARE new_avg DECIMAL(15,8);
    

    SELECT COALESCE(quantity, 0), COALESCE(average_cost, 0) 
    INTO current_qty, current_avg
    FROM portfolio_holdings 
    WHERE portfolio_id = NEW.portfolio_id AND symbol = NEW.symbol;
    
    IF NEW.transaction_type = 'buy' THEN
        SET new_qty = current_qty + NEW.quantity;
        
        IF current_qty > 0 THEN
            SET new_avg = ((current_qty * current_avg) + (NEW.quantity * NEW.price)) / new_qty;
        ELSE
            SET new_avg = NEW.price;
        END IF;
        
        INSERT INTO portfolio_holdings (portfolio_id, symbol, quantity, average_cost, purchase_date)
        VALUES (NEW.portfolio_id, NEW.symbol, new_qty, new_avg, NEW.transaction_date)
        ON DUPLICATE KEY UPDATE 
            quantity = new_qty,
            average_cost = new_avg;
            
    ELSE 
        SET new_qty = current_qty - NEW.quantity;
        
        IF new_qty >= 0 THEN
            UPDATE portfolio_holdings 
            SET quantity = new_qty
            WHERE portfolio_id = NEW.portfolio_id AND symbol = NEW.symbol;
        END IF;
    END IF;
END//
DELIMITER ;


DELIMITER //
CREATE PROCEDURE GetUserInvestmentSummary(IN p_user_id INT)
BEGIN
    SELECT 
        COUNT(DISTINCT p.id) as total_portfolios,
        COALESCE(SUM(p.initial_amount), 0) as total_initial_investment,
        COALESCE(SUM(p.current_value), 0) as total_current_value,
        COUNT(DISTINCT h.symbol) as total_unique_holdings,
        COUNT(t.id) as total_transactions
    FROM investment_portfolios p
    LEFT JOIN portfolio_holdings h ON p.id = h.portfolio_id AND h.quantity > 0
    LEFT JOIN trading_transactions t ON p.id = t.portfolio_id
    WHERE p.user_id = p_user_id AND p.is_active = TRUE;
END//
DELIMITER ;