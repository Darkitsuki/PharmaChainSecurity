-- =============================================================================
-- SCRIPT 05: TEARDOWN / REMOVE ORACLE VPD POLICIES (ROLLBACK SCRIPT)
-- PROJECT: PharmaSecure — Multi-Branch Pharmacy Management System
-- PURPOSE: Safely drop VPD policies and contexts if maintenance or schema migration requires it.
-- =============================================================================

DECLARE
    TYPE t_table_array IS TABLE OF VARCHAR2(50);
    v_tables t_table_array := t_table_array(
        'INVOICES',
        'INVENTORIES',
        'INVENTORY_TRANSACTIONS',
        'GOODS_RECEIPTS',
        'USERS',
        'CUSTOMERS'
    );
    v_policy_name VARCHAR2(100);
BEGIN
    FOR i IN 1..v_tables.COUNT LOOP
        v_policy_name := 'POL_BRANCH_' || v_tables(i);
        BEGIN
            DBMS_RLS.DROP_POLICY(
                object_schema => USER,
                object_name   => v_tables(i),
                policy_name   => v_policy_name
            );
            DBMS_OUTPUT.PUT_LINE('Successfully dropped policy: ' || v_policy_name || ' from ' || v_tables(i));
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE('Policy ' || v_policy_name || ' does not exist or already dropped.');
        END;
    END LOOP;
END;
/

-- Optional: Drop context and package if complete teardown is requested
-- DROP CONTEXT PHARMA_CTX;
-- DROP PACKAGE PKG_SESSION_CTX;
-- DROP FUNCTION FN_BRANCH_SECURITY_PREDICATE;
