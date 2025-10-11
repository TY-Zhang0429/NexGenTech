    -- =====================================================
    -- NEXGEN NUTRITION APP - COMPLETE DATABASE SCHEMA
    -- Based on ERD: All Epics (PK underlined, FK labelled in field name)
    -- =====================================================

    -- Create database
    CREATE DATABASE IF NOT EXISTS nexgen_nutrition;
    USE nexgen_nutrition;

    -- =====================================================
    -- EPIC 3 - NUTRIENT PANEL (Simplified)
    -- =====================================================

    -- FOOD Table - Stores general information about food items
    CREATE TABLE IF NOT EXISTS FOOD (
        food_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        food_group VARCHAR(50) NOT NULL,
        image_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_food_group (food_group),
        INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- NUTRIENT Table - Stores definitions and details for various nutrients
    CREATE TABLE IF NOT EXISTS NUTRIENT (
        nutrient_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        limit_low DECIMAL(10,2) NULL COMMENT 'Optional lower limit',
        limit_high DECIMAL(10,2) NULL COMMENT 'Optional higher limit',
        remark TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_name (name),
        INDEX idx_unit (unit)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- FOOD_NUTRIENT Table - Junction table linking FOOD to NUTRIENT
    CREATE TABLE IF NOT EXISTS FOOD_NUTRIENT (
        food_id BIGINT UNSIGNED NOT NULL,
        nutrient_id BIGINT UNSIGNED NOT NULL,
        per_100g DECIMAL(10,4) NOT NULL COMMENT 'Nutrient amount per 100g',
        per_serve DECIMAL(10,4) NOT NULL COMMENT 'Nutrient amount per serving',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        PRIMARY KEY (food_id, nutrient_id),
        FOREIGN KEY (food_id) REFERENCES FOOD(food_id) ON DELETE CASCADE,
        FOREIGN KEY (nutrient_id) REFERENCES NUTRIENT(nutrient_id) ON DELETE CASCADE,
        
        INDEX idx_per_100g (per_100g),
        INDEX idx_per_serve (per_serve)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- FOOD_SWAP Table - Manages suggestions for swapping one food item for another
    CREATE TABLE IF NOT EXISTS FOOD_SWAP (
        swap_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        from_food_id BIGINT UNSIGNED NOT NULL,
        to_food_id BIGINT UNSIGNED NOT NULL,
        reason_tag VARCHAR(50) NOT NULL COMMENT 'e.g., lower_sugar, hydration',
        rationale_short VARCHAR(200) NOT NULL COMMENT 'Short explanation',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (from_food_id) REFERENCES FOOD(food_id) ON DELETE CASCADE,
        FOREIGN KEY (to_food_id) REFERENCES FOOD(food_id) ON DELETE CASCADE,
        
        INDEX idx_from_food (from_food_id),
        INDEX idx_to_food (to_food_id),
        INDEX idx_reason_tag (reason_tag),
        UNIQUE KEY unique_swap (from_food_id, to_food_id, reason_tag)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- =====================================================
    -- EPIC 4 - GAMES & ENGAGEMENT (Simplified)
    -- =====================================================

    -- GAME_TERM Table - Stores terms and clues used in games
    CREATE TABLE IF NOT EXISTS GAME_TERM (
        term_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        term VARCHAR(100) NOT NULL,
        clue TEXT NOT NULL,
        type ENUM('wordle', 'crossword') NOT NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_term (term),
        INDEX idx_type (type),
        INDEX idx_difficulty (difficulty)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- PUZZLE Table - Defines individual puzzles or game instances
    CREATE TABLE IF NOT EXISTS PUZZLE (
        puzzle_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        game_type ENUM('wordle', 'crossword', 'match3') NOT NULL,
        seed VARCHAR(100) NULL COMMENT 'Random seed for puzzle generation',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_game_type (game_type),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- PUZZLE_ENTRY Table - Links PUZZLEs to GAME_TERMs
    CREATE TABLE IF NOT EXISTS PUZZLE_ENTRY (
        entry_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        puzzle_id BIGINT UNSIGNED NOT NULL,
        term_id BIGINT UNSIGNED NOT NULL,
        row_pos INT NULL COMMENT 'Row position for crossword',
        col_pos INT NULL COMMENT 'Column position for crossword',
        direction ENUM('across', 'down') NULL COMMENT 'Direction for crossword',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (puzzle_id) REFERENCES PUZZLE(puzzle_id) ON DELETE CASCADE,
        FOREIGN KEY (term_id) REFERENCES GAME_TERM(term_id) ON DELETE CASCADE,
        
        INDEX idx_puzzle (puzzle_id),
        INDEX idx_term (term_id),
        INDEX idx_position (row_pos, col_pos)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- GAME_SCORE Table - Records player scores for completed puzzles
    CREATE TABLE IF NOT EXISTS GAME_SCORE (
        score_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        puzzle_id BIGINT UNSIGNED NOT NULL,
        player_alias VARCHAR(50) NOT NULL,
        score INT NOT NULL COMMENT 'Score achieved',
        time_ms INT NOT NULL COMMENT 'Time taken in milliseconds',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (puzzle_id) REFERENCES PUZZLE(puzzle_id) ON DELETE CASCADE,
        
        INDEX idx_puzzle (puzzle_id),
        INDEX idx_player (player_alias),
        INDEX idx_score (score),
        INDEX idx_time (time_ms)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- =====================================================
    -- EPIC 5 - AVATAR & QUESTIONNAIRE (Simplified)
    -- =====================================================

    -- AVATAR_BASE Table - Stores base information for different avatar options
    CREATE TABLE IF NOT EXISTS AVATAR_BASE (
        avatar_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        image VARCHAR(100) NOT NULL COMMENT 'Image filename',
        description TEXT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_name (name),
        INDEX idx_is_default (is_default)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- QUESTION Table - Stores the questions for the questionnaire
    CREATE TABLE IF NOT EXISTS QUESTION (
        question_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        text TEXT NOT NULL,
        question_order INT NOT NULL COMMENT 'Order of questions',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_order (question_order),
        INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- QUESTION_OPTION Table - Stores the possible answer options for each QUESTION
    CREATE TABLE IF NOT EXISTS QUESTION_OPTION (
        option_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        question_id BIGINT UNSIGNED NOT NULL,
        option_text VARCHAR(200) NOT NULL,
        option_order INT NOT NULL COMMENT 'Order of options within question',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (question_id) REFERENCES QUESTION(question_id) ON DELETE CASCADE,
        
        INDEX idx_question (question_id),
        INDEX idx_order (option_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- OPTION_TO_AVATAR Table - Maps QUESTION_OPTIONs to AVATAR_BASEs
    CREATE TABLE IF NOT EXISTS OPTION_TO_AVATAR (
        mapping_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        option_id BIGINT UNSIGNED NOT NULL,
        avatar_id BIGINT UNSIGNED NOT NULL,
        weight DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Weight to influence avatar selection',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (option_id) REFERENCES QUESTION_OPTION(option_id) ON DELETE CASCADE,
        FOREIGN KEY (avatar_id) REFERENCES AVATAR_BASE(avatar_id) ON DELETE CASCADE,
        
        INDEX idx_option (option_id),
        INDEX idx_avatar (avatar_id),
        INDEX idx_weight (weight)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- =====================================================
    -- EPIC 7 - AI POWERED WEEKEND PROJECT
    -- =====================================================

    -- USER_SESSION Table - Stores temporary session data (no PII)
    CREATE TABLE IF NOT EXISTS USER_SESSION (
        session_id VARCHAR(100) PRIMARY KEY,
        session_data JSON NULL COMMENT 'Temporary session preferences and state',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL COMMENT 'Session expiration time',
        
        INDEX idx_expires_at (expires_at),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- AI_RECIPE_REQUEST Table - Stores AI recipe generation requests
    CREATE TABLE IF NOT EXISTS AI_RECIPE_REQUEST (
        request_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(100) NOT NULL,
        ingredients TEXT NOT NULL COMMENT 'Comma-separated list of ingredients',
        serving_size INT NOT NULL,
        dietary_goals JSON NULL COMMENT 'e.g., {"low_sugar": true, "high_protein": true}',
        request_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (session_id) REFERENCES USER_SESSION(session_id) ON DELETE CASCADE,
        
        INDEX idx_session (session_id),
        INDEX idx_status (request_status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- AI_RECIPE_SUGGESTION Table - Stores AI-generated recipe suggestions
    CREATE TABLE IF NOT EXISTS AI_RECIPE_SUGGESTION (
        suggestion_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        request_id BIGINT UNSIGNED NOT NULL,
        recipe_name VARCHAR(200) NOT NULL,
        ingredients JSON NOT NULL COMMENT 'Detailed ingredients with measurements',
        directions JSON NOT NULL COMMENT 'Step-by-step cooking instructions',
        nutritional_data JSON NOT NULL COMMENT 'Complete nutritional breakdown',
        ai_model_version VARCHAR(50) NOT NULL,
        confidence_score DECIMAL(3,2) DEFAULT 0.00 COMMENT 'AI confidence score 0-1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (request_id) REFERENCES AI_RECIPE_REQUEST(request_id) ON DELETE CASCADE,
        
        INDEX idx_request (request_id),
        INDEX idx_confidence (confidence_score),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- IMAGE_RECOGNITION Table - Stores image upload and recognition data
    CREATE TABLE IF NOT EXISTS IMAGE_RECOGNITION (
        recognition_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(100) NOT NULL,
        image_filename VARCHAR(200) NOT NULL COMMENT 'Stored image filename',
        image_hash VARCHAR(64) NOT NULL COMMENT 'SHA256 hash for deduplication',
        recognition_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        detected_foods JSON NULL COMMENT 'AI-detected food items',
        recipe_suggestion JSON NULL COMMENT 'Generated recipe from image',
        nutritional_analysis JSON NULL COMMENT 'Nutritional breakdown of detected foods',
        ai_model_version VARCHAR(50) NOT NULL,
        confidence_score DECIMAL(3,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (session_id) REFERENCES USER_SESSION(session_id) ON DELETE CASCADE,
        
        INDEX idx_session (session_id),
        INDEX idx_hash (image_hash),
        INDEX idx_status (recognition_status),
        INDEX idx_confidence (confidence_score)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- MEAL_PLAN_REQUEST Table - Stores meal planning requests
    CREATE TABLE IF NOT EXISTS MEAL_PLAN_REQUEST (
        plan_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(100) NOT NULL,
        dietary_preferences JSON NOT NULL COMMENT 'User dietary preferences and restrictions',
        meal_goals JSON NOT NULL COMMENT 'Nutritional goals and targets',
        budget_constraints JSON NULL COMMENT 'Budget and availability constraints',
        plan_type ENUM('daily', 'weekly') DEFAULT 'daily',
        request_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (session_id) REFERENCES USER_SESSION(session_id) ON DELETE CASCADE,
        
        INDEX idx_session (session_id),
        INDEX idx_status (request_status),
        INDEX idx_type (plan_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- MEAL_PLAN_SUGGESTION Table - Stores generated meal plans
    CREATE TABLE IF NOT EXISTS MEAL_PLAN_SUGGESTION (
        suggestion_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        plan_id BIGINT UNSIGNED NOT NULL,
        meal_type ENUM('breakfast', 'lunch', 'snack', 'dinner') NOT NULL,
        recipe_suggestion JSON NOT NULL COMMENT 'Suggested recipe for this meal',
        nutritional_summary JSON NOT NULL COMMENT 'Nutritional data for this meal',
        shopping_list JSON NULL COMMENT 'Ingredients needed for this meal',
        ai_model_version VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (plan_id) REFERENCES MEAL_PLAN_REQUEST(plan_id) ON DELETE CASCADE,
        
        INDEX idx_plan (plan_id),
        INDEX idx_meal_type (meal_type),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- NUTRITION_BOT_CONVERSATION Table - Stores chatbot conversations
    CREATE TABLE IF NOT EXISTS NUTRITION_BOT_CONVERSATION (
        conversation_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(100) NOT NULL,
        user_message TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        message_type ENUM('question', 'clarification', 'suggestion', 'fact') NOT NULL,
        topic_category VARCHAR(100) NULL COMMENT 'e.g., nutrition, cooking, health',
        confidence_score DECIMAL(3,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (session_id) REFERENCES USER_SESSION(session_id) ON DELETE CASCADE,
        
        INDEX idx_session (session_id),
        INDEX idx_type (message_type),
        INDEX idx_category (topic_category),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- AI_MODEL_VERSION Table - Tracks AI model versions and performance
    CREATE TABLE IF NOT EXISTS AI_MODEL_VERSION (
        model_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        model_name VARCHAR(100) NOT NULL,
        model_version VARCHAR(50) NOT NULL,
        model_type ENUM('recipe_generation', 'image_recognition', 'meal_planning', 'nutrition_bot') NOT NULL,
        performance_metrics JSON NULL COMMENT 'Model performance data',
        is_active BOOLEAN DEFAULT TRUE,
        deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_name (model_name),
        INDEX idx_type (model_type),
        INDEX idx_active (is_active),
        UNIQUE KEY unique_model_version (model_name, model_version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- =====================================================
    -- LEGACY TABLES (From Previous Iterations)
    -- =====================================================

    -- Keep existing tables for backward compatibility
    CREATE TABLE IF NOT EXISTS food_swaps_teen_fun (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        category VARCHAR(40) NOT NULL,
        from_name_short VARCHAR(80) NOT NULL,
        to_name_short VARCHAR(80) NOT NULL,
        reason_tag VARCHAR(40) NOT NULL,
        rationale_short VARCHAR(200) NOT NULL,
        from_code VARCHAR(32) NULL,
        to_code VARCHAR(32) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        KEY ix_cat (category),
        KEY ix_from (from_name_short),
        KEY ix_to (to_name_short),
        UNIQUE KEY uq_swap (category, from_name_short, to_name_short)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS wordle_seed (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        word VARCHAR(50) NOT NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        hint TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_word (word),
        INDEX idx_difficulty (difficulty)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- =====================================================
    -- SAMPLE DATA INSERTION
    -- =====================================================

    -- Insert sample nutrients
    INSERT INTO NUTRIENT (name, unit, limit_low, limit_high, remark) VALUES
    ('Calories', 'kcal', 2000, 2500, 'Daily energy intake for teens 15-19'),
    ('Protein', 'g', 45, 65, 'Daily protein requirement for teens 15-19'),
    ('Carbohydrates', 'g', 130, 300, 'Daily carb requirement for teens 15-19'),
    ('Fat', 'g', 25, 35, 'Daily fat requirement for teens 15-19'),
    ('Fiber', 'g', 25, 35, 'Daily fiber requirement for teens 15-19'),
    ('Sugar', 'g', 0, 50, 'Daily sugar limit for teens 15-19'),
    ('Sodium', 'mg', 0, 2300, 'Daily sodium limit for teens 15-19');

    -- Insert sample avatars
    INSERT INTO AVATAR_BASE (name, image, description, is_default) VALUES
    ('Sol', 'sol_default.png', 'Default friendly avatar', TRUE),
    ('Luna', 'luna_healthy.png', 'Health-focused avatar', FALSE),
    ('Nova', 'nova_active.png', 'Active lifestyle avatar', FALSE),
    ('Zara', 'zara_creative.png', 'Creative cooking avatar', FALSE);

    -- Insert sample questions
    INSERT INTO QUESTION (text, question_order, is_active) VALUES
    ('What is your favorite type of food?', 1, TRUE),
    ('How often do you cook at home?', 2, TRUE),
    ('What motivates you to eat healthy?', 3, TRUE),
    ('What is your preferred meal time?', 4, TRUE);

    -- Insert sample game terms
    INSERT INTO GAME_TERM (term, clue, type, difficulty) VALUES
    ('Apple', 'Red fruit that keeps the doctor away', 'wordle', 'easy'),
    ('Protein', 'Essential nutrient for muscle building', 'crossword', 'medium'),
    ('Vitamin', 'Essential micronutrient for health', 'crossword', 'medium'),
    ('Calories', 'Unit of energy in food', 'wordle', 'easy');

    -- Insert sample AI model versions
    INSERT INTO AI_MODEL_VERSION (model_name, model_version, model_type, performance_metrics, is_active) VALUES
    ('RecipeGen-v1', '1.0.0', 'recipe_generation', '{"accuracy": 0.85, "response_time": 2.3}', TRUE),
    ('ImageRec-v1', '1.0.0', 'image_recognition', '{"accuracy": 0.92, "response_time": 1.8}', TRUE),
    ('MealPlan-v1', '1.0.0', 'meal_planning', '{"accuracy": 0.88, "response_time": 3.1}', TRUE),
    ('NutritionBot-v1', '1.0.0', 'nutrition_bot', '{"accuracy": 0.90, "response_time": 1.2}', TRUE);

    -- =====================================================
    -- VIEWS FOR COMMON QUERIES
    -- =====================================================

    -- View for food with complete nutritional information
    CREATE VIEW food_nutrition_complete AS
    SELECT 
        f.food_id,
        f.name,
        f.food_group,
        f.image_name,
        GROUP_CONCAT(
            CONCAT(n.name, ': ', fn.per_100g, ' ', n.unit, ' per 100g')
            SEPARATOR ', '
        ) as nutrition_summary
    FROM FOOD f
    LEFT JOIN FOOD_NUTRIENT fn ON f.food_id = fn.food_id
    LEFT JOIN NUTRIENT n ON fn.nutrient_id = n.nutrient_id
    GROUP BY f.food_id, f.name, f.food_group, f.image_name;

    -- View for active questions with options
    CREATE VIEW questionnaire_active AS
    SELECT 
        q.question_id,
        q.text as question_text,
        q.question_order,
        GROUP_CONCAT(
            CONCAT(qo.option_id, ': ', qo.option_text)
            ORDER BY qo.option_order
            SEPARATOR ' | '
        ) as options
    FROM QUESTION q
    LEFT JOIN QUESTION_OPTION qo ON q.question_id = qo.question_id
    WHERE q.is_active = TRUE
    GROUP BY q.question_id, q.text, q.question_order
    ORDER BY q.question_order;

    -- View for AI recipe requests with suggestions
    CREATE VIEW ai_recipe_summary AS
    SELECT 
        arr.request_id,
        arr.session_id,
        arr.ingredients,
        arr.serving_size,
        arr.dietary_goals,
        arr.request_status,
        COUNT(ars.suggestion_id) as suggestion_count,
        AVG(ars.confidence_score) as avg_confidence,
        arr.created_at
    FROM AI_RECIPE_REQUEST arr
    LEFT JOIN AI_RECIPE_SUGGESTION ars ON arr.request_id = ars.request_id
    GROUP BY arr.request_id, arr.session_id, arr.ingredients, arr.serving_size, 
            arr.dietary_goals, arr.request_status, arr.created_at;

    -- View for image recognition results
    CREATE VIEW image_recognition_summary AS
    SELECT 
        ir.recognition_id,
        ir.session_id,
        ir.image_filename,
        ir.recognition_status,
        ir.confidence_score,
        JSON_EXTRACT(ir.detected_foods, '$') as detected_foods,
        ir.created_at
    FROM IMAGE_RECOGNITION ir
    WHERE ir.recognition_status = 'completed';

    -- View for meal plan suggestions
    CREATE VIEW meal_plan_summary AS
    SELECT 
        mpr.plan_id,
        mpr.session_id,
        mpr.dietary_preferences,
        mpr.meal_goals,
        mpr.plan_type,
        mpr.request_status,
        COUNT(mps.suggestion_id) as meal_count,
        GROUP_CONCAT(mps.meal_type ORDER BY mps.meal_type) as included_meals,
        mpr.created_at
    FROM MEAL_PLAN_REQUEST mpr
    LEFT JOIN MEAL_PLAN_SUGGESTION mps ON mpr.plan_id = mps.plan_id
    GROUP BY mpr.plan_id, mpr.session_id, mpr.dietary_preferences, 
            mpr.meal_goals, mpr.plan_type, mpr.request_status, mpr.created_at;

    -- View for nutrition bot conversation history
    CREATE VIEW nutrition_bot_conversations AS
    SELECT 
        nbc.conversation_id,
        nbc.session_id,
        nbc.user_message,
        nbc.bot_response,
        nbc.message_type,
        nbc.topic_category,
        nbc.confidence_score,
        nbc.created_at
    FROM NUTRITION_BOT_CONVERSATION nbc
    ORDER BY nbc.session_id, nbc.created_at;

    -- =====================================================
    -- INDEXES FOR PERFORMANCE
    -- =====================================================

    -- Additional indexes for common query patterns
    CREATE INDEX idx_food_nutrient_per_100g ON FOOD_NUTRIENT(per_100g);
    CREATE INDEX idx_food_nutrient_per_serve ON FOOD_NUTRIENT(per_serve);
    CREATE INDEX idx_game_score_created_at ON GAME_SCORE(created_at);
    CREATE INDEX idx_question_option_text ON QUESTION_OPTION(option_text);

    -- =====================================================
    -- STORED PROCEDURES
    -- =====================================================

    DELIMITER //

    -- Procedure to get food swaps for a specific food
    CREATE PROCEDURE GetFoodSwaps(IN food_name VARCHAR(100))
    BEGIN
        SELECT 
            fs.swap_id,
            f1.name as from_food,
            f2.name as to_food,
            fs.reason_tag,
            fs.rationale_short
        FROM FOOD_SWAP fs
        JOIN FOOD f1 ON fs.from_food_id = f1.food_id
        JOIN FOOD f2 ON fs.to_food_id = f2.food_id
        WHERE f1.name LIKE CONCAT('%', food_name, '%')
        ORDER BY fs.created_at DESC;
    END //

    -- Procedure to calculate avatar recommendation based on answers
    CREATE PROCEDURE CalculateAvatarRecommendation(
        IN answer_ids TEXT
    )
    BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE avatar_id_var BIGINT;
        DECLARE total_weight DECIMAL(10,2);
        
        -- This would need to be implemented based on the specific logic
        -- for calculating avatar recommendations
        SELECT 'Avatar recommendation logic to be implemented' as message;
    END //

    -- Procedure to create a new AI recipe request
    CREATE PROCEDURE CreateAIRecipeRequest(
        IN p_session_id VARCHAR(100),
        IN p_ingredients TEXT,
        IN p_serving_size INT,
        IN p_dietary_goals JSON
    )
    BEGIN
        DECLARE request_id_var BIGINT;
        
        INSERT INTO AI_RECIPE_REQUEST (session_id, ingredients, serving_size, dietary_goals)
        VALUES (p_session_id, p_ingredients, p_serving_size, p_dietary_goals);
        
        SET request_id_var = LAST_INSERT_ID();
        
        SELECT request_id_var as request_id, 'pending' as status;
    END //

    -- Procedure to get AI recipe suggestions for a request
    CREATE PROCEDURE GetAIRecipeSuggestions(IN p_request_id BIGINT)
    BEGIN
        SELECT 
            ars.suggestion_id,
            ars.recipe_name,
            ars.ingredients,
            ars.directions,
            ars.nutritional_data,
            ars.confidence_score,
            ars.created_at
        FROM AI_RECIPE_SUGGESTION ars
        WHERE ars.request_id = p_request_id
        ORDER BY ars.confidence_score DESC;
    END //

    -- Procedure to create image recognition request
    CREATE PROCEDURE CreateImageRecognitionRequest(
        IN p_session_id VARCHAR(100),
        IN p_image_filename VARCHAR(200),
        IN p_image_hash VARCHAR(64)
    )
    BEGIN
        DECLARE recognition_id_var BIGINT;
        
        INSERT INTO IMAGE_RECOGNITION (session_id, image_filename, image_hash, ai_model_version)
        VALUES (p_session_id, p_image_filename, p_image_hash, 'ImageRec-v1');
        
        SET recognition_id_var = LAST_INSERT_ID();
        
        SELECT recognition_id_var as recognition_id, 'pending' as status;
    END //

    -- Procedure to create meal plan request
    CREATE PROCEDURE CreateMealPlanRequest(
        IN p_session_id VARCHAR(100),
        IN p_dietary_preferences JSON,
        IN p_meal_goals JSON,
        IN p_budget_constraints JSON,
        IN p_plan_type ENUM('daily', 'weekly')
    )
    BEGIN
        DECLARE plan_id_var BIGINT;
        
        INSERT INTO MEAL_PLAN_REQUEST (session_id, dietary_preferences, meal_goals, budget_constraints, plan_type)
        VALUES (p_session_id, p_dietary_preferences, p_meal_goals, p_budget_constraints, p_plan_type);
        
        SET plan_id_var = LAST_INSERT_ID();
        
        SELECT plan_id_var as plan_id, 'pending' as status;
    END //

    -- Procedure to log nutrition bot conversation
    CREATE PROCEDURE LogNutritionBotConversation(
        IN p_session_id VARCHAR(100),
        IN p_user_message TEXT,
        IN p_bot_response TEXT,
        IN p_message_type ENUM('question', 'clarification', 'suggestion', 'fact'),
        IN p_topic_category VARCHAR(100),
        IN p_confidence_score DECIMAL(3,2)
    )
    BEGIN
        INSERT INTO NUTRITION_BOT_CONVERSATION 
        (session_id, user_message, bot_response, message_type, topic_category, confidence_score)
        VALUES (p_session_id, p_user_message, p_bot_response, p_message_type, p_topic_category, p_confidence_score);
        
        SELECT LAST_INSERT_ID() as conversation_id;
    END //

    -- Procedure to clean up expired sessions
    CREATE PROCEDURE CleanupExpiredSessions()
    BEGIN
        DELETE FROM USER_SESSION WHERE expires_at < NOW();
        
        SELECT ROW_COUNT() as deleted_sessions;
    END //

    DELIMITER ;

    -- =====================================================
    -- TRIGGERS
    -- =====================================================

    -- Trigger to update timestamp on FOOD table
    DELIMITER //
    CREATE TRIGGER food_updated_at 
        BEFORE UPDATE ON FOOD
        FOR EACH ROW
    BEGIN
        SET NEW.updated_at = CURRENT_TIMESTAMP;
    END //
    DELIMITER ;

    -- =====================================================
    -- GRANTS AND PERMISSIONS
    -- =====================================================

    -- Create application user (replace with actual credentials)
    -- CREATE USER 'nexgen_app'@'%' IDENTIFIED BY 'secure_password';
    -- GRANT SELECT, INSERT, UPDATE, DELETE ON nexgen_nutrition.* TO 'nexgen_app'@'%';
    -- FLUSH PRIVILEGES;

    -- =====================================================
    -- COMMENTS AND DOCUMENTATION
    -- =====================================================

    -- This schema implements the ERD structure for all four epics:
    -- Epic 3: Nutrient Panel - FOOD, NUTRIENT, FOOD_NUTRIENT, FOOD_SWAP
    -- Epic 4: Games & Engagement - GAME_TERM, PUZZLE, PUZZLE_ENTRY, GAME_SCORE
    -- Epic 5: Avatar & Questionnaire - AVATAR_BASE, QUESTION, QUESTION_OPTION, OPTION_TO_AVATAR
    -- Epic 7: AI Powered Weekend Project - USER_SESSION, AI_RECIPE_REQUEST, AI_RECIPE_SUGGESTION, 
    --         IMAGE_RECOGNITION, MEAL_PLAN_REQUEST, MEAL_PLAN_SUGGESTION, NUTRITION_BOT_CONVERSATION, AI_MODEL_VERSION
    --
    -- All primary keys are underlined in the ERD
    -- All foreign keys are labelled in field names
    -- Relationships are properly established with foreign key constraints
    -- Indexes are created for performance optimization
    -- Sample data is included for testing
    -- AI features support session-based interactions without storing PII
    -- JSON columns used for flexible data storage (ingredients, nutritional data, etc.)
