-- =============================================================================
-- SCRIPT 03: ATTACH ORACLE VPD (DBMS_RLS) POLICIES TO BRANCH-OWNED TABLES
-- PROJECT: PharmaSecure — Multi-Branch Pharmacy Management System
-- GOVERNANCE: Rule 03 (Security), Rule 06 (Branch Isolation), Skill 07 (Oracle)
-- =============================================================================

DECLARE
    TYPE t_table_array IS TABLE OF VARCHAR2(50);
    v_tables t_table_array := t_table_array(
        'INVOICES',
        'INVENTORIES',
        'INVENTORY_TRANSACTIONS',
        'GOODS_RECEIPTS',
        'USERS',
        'CUSTOMERS',
        'RETURNS'
    );
    v_policy_name VARCHAR2(100);
    v_count NUMBER;
BEGIN
    FOR i IN 1..v_tables.COUNT LOOP
        v_policy_name := 'POL_BRANCH_' || v_tables(i);

        -- 1. Drop existing policy if already registered (idempotency)
        SELECT COUNT(*) INTO v_count
        FROM ALL_POLICIES
        WHERE OBJECT_NAME = v_tables(i)
          AND POLICY_NAME = v_policy_name;

        IF v_count > 0 THEN
            DBMS_RLS.DROP_POLICY(
                object_schema => USER,
                object_name   => v_tables(i),
                policy_name   => v_policy_name
            );
            DBMS_OUTPUT.PUT_LINE('Dropped existing policy: ' || v_policy_name);
        END IF;

        -- 2. Attach VPD policy via DBMS_RLS.ADD_POLICY
        -- statement_types: Applies to SELECT (query isolation), INSERT, UPDATE, DELETE (mutation isolation)
        -- update_check: TRUE ensures INSERTs and UPDATEs cannot introduce cross-branch rows (block predicate)
        DBMS_RLS.ADD_POLICY(
            object_schema   => USER,
            object_name     => v_tables(i),
            policy_name     => v_policy_name,
            function_schema => USER,
            policy_function => 'FN_BRANCH_SECURITY_PREDICATE',
            statement_types => 'SELECT,INSERT,UPDATE,DELETE',
            update_check    => TRUE,
            enable          => TRUE
        );

        DBMS_OUTPUT.PUT_LINE('Successfully registered VPD policy: ' || v_policy_name || ' on table: ' || v_tables(i));
    END LOOP;

    DBMS_OUTPUT.PUT_LINE('=====================================================');
    DBMS_OUTPUT.PUT_LINE('All branch-scoped tables are now protected by Oracle VPD.');
    DBMS_OUTPUT.PUT_LINE('=====================================================');
END;
/
